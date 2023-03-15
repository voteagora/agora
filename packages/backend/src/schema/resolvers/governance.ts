import {
  DelegateResolvers,
  DelegateSnapshotResolvers,
  DelegatesOrder,
  MetricsResolvers,
  NounResolvers,
  ProposalResolvers,
  ProposalStatus,
  ProposalTransactionResolvers,
  QueryResolvers,
  VoteResolvers,
  VotingPowerResolvers,
} from "./generated/types";
import { BigNumber, ethers } from "ethers";
import {
  governanceAggregatesKey,
  makeDefaultGovernanceAggregate,
  totalVotes,
} from "../../indexer/contracts/NounsDAO";
import {
  aggregateCumulativeId,
  defaultAccount,
  makeDefaultAggregate,
} from "../../indexer/contracts/NounsToken";
import { exactIndexValue, Reader } from "../../indexer/storage/reader";
import { RuntimeType } from "../../indexer/serde";
import {
  collectGenerator,
  countItems,
  filterGenerator,
  limitGenerator,
  takeFirst,
} from "../../indexer/utils/generatorUtils";
import { getTitleFromProposalDescription } from "../../utils/markdown";
import { driveReaderByIndex } from "../pagination";
import { formSchema } from "../../formSchema";
import { approximateTimeStampForBlock } from "../../utils/blockTimestamp";
import { makeCompoundKey } from "../../indexer/indexKey";
import { intersection } from "../../utils/set";
import { countConsecutiveValues } from "../../utils/array";
import { entityDefinitions } from "../../indexer/contracts/entityDefinitions";
import { resolveEnsOrNnsName } from "../../utils/resolveName";
import { efficientLengthEncodingNaturalNumbers } from "../../indexer/utils/efficientLengthEncoding";

const amountSpec = {
  currency: "NOUN",
  decimals: 0,
};

const quorumDenominator = BigNumber.from(100 * 100);

export type VotingPowerModel = BigNumber;

export const VotingPower: VotingPowerResolvers = {
  amount(value) {
    return asTokenAmount(value);
  },

  async bpsOfTotal(value, _args, { reader }) {
    const aggregate = await getAggregate(reader);

    return bpsOf(value, aggregate.totalSupply);
  },

  async bpsOfDelegatedSupply(value, _args, { reader }) {
    const aggregate = await getAggregate(reader);

    return bpsOf(value, aggregate.delegatedSupply);
  },

  async bpsOfQuorum(value, _args, { reader }) {
    const quorum = await getQuorum(reader);
    return bpsOf(value, quorum);
  },
};

export type MetricsModel = {};

export const Metrics: MetricsResolvers = {
  async delegatedSupply(_parent, _args, { reader }) {
    const aggregate = await getAggregate(reader);
    return asTokenAmount(aggregate.delegatedSupply);
  },
  async totalSupply(_parent, _args, { reader }) {
    const aggregate = await getAggregate(reader);
    return asTokenAmount(aggregate.totalSupply);
  },

  async quorumFloor(_parent, _args, { reader }) {
    const agg = await getGovernanceAggregate(reader);
    return await bpsOfSupply(agg.quorumFloorBps, reader);
  },

  async quorumCeiling(_parent, _args, { reader }) {
    const agg = await getGovernanceAggregate(reader);
    return await bpsOfSupply(agg.quorumCeilingBps, reader);
  },

  async ownersCount(_parent, _args, { reader }) {
    return await countItems(
      (async function* () {
        for await (const address of reader.getEntitiesByIndex(
          "Address",
          "byTokensOwned",
          {}
        )) {
          if (!address.value.tokensOwnedIds.length) {
            return;
          }

          yield address;
        }
      })()
    );
  },

  async proposalThreshold(_parents, _args, { reader }) {
    const agg = await getGovernanceAggregate(reader);
    return (await bpsOfSupply(agg.proposalThresholdBps.toNumber(), reader)).add(
      1
    );
  },

  async delegatesCount(_parents, _args, { reader }) {
    return await countItems(
      (async function* () {
        for await (const address of reader.getEntitiesByIndex(
          "Address",
          "byTokensRepresented",
          {}
        )) {
          if (address.value.tokensRepresented.isZero()) {
            return;
          }

          yield address;
        }
      })()
    );
  },

  async recentVoterTurnoutBps(_parents, _args, { reader }) {
    const counts = await collectGenerator(
      limitGenerator(
        (async function* () {
          for await (const { value: proposal } of reader.getEntitiesByIndex(
            "Proposal",
            "byEndBlock",
            {}
          )) {
            const totalVotesCount = totalVotes(proposal.aggregates);
            if (totalVotesCount.eq(0)) {
              continue;
            }

            yield totalVotesCount
              .mul(100 * 100)
              .div(proposal.snapshot.totalSupply);
          }
        })(),
        40
      )
    );

    const total = counts.reduce(
      (acc, item) => acc.add(item),
      BigNumber.from(0)
    );

    if (!counts.length) {
      return 0;
    }

    return total.div(counts.length).toNumber();
  },
};

export const Query: QueryResolvers = {
  async delegate(_, { addressOrEnsName }, { ethProvider, reader }) {
    const address = await resolveEnsOrNnsName(addressOrEnsName, ethProvider);
    if (!address) {
      throw new Error("failed to resolve address");
    }

    return (
      (await reader.getEntity("Address", address)) ?? defaultAccount(address)
    );
  },

  async votes(_, { proposalId, first, after }, { reader }) {
    return driveReaderByIndex(
      reader,
      "Vote",
      "byProposalByVotes",
      first,
      after ?? null,
      {
        indexKey: makeCompoundKey(proposalId.toString(), ""),
      }
    );
  },

  metrics() {
    return {};
  },

  async proposal(_, { id }, { reader }) {
    return (await reader.getEntity("Proposal", id))!;
  },

  async proposals(_, {}, { reader }) {
    return (
      await collectGenerator(
        reader.getEntitiesByIndex("Proposal", "byEndBlock", {})
      )
    ).map((it) => it.value);
  },

  async delegates(_, { orderBy, first, where, after }, { reader }) {
    return await driveReaderByIndex(
      reader,
      "Address",
      (() => {
        switch (orderBy) {
          case DelegatesOrder.LeastVotesCast:
            return "byVotesCastAsc";

          case DelegatesOrder.MostVotesCast:
            return "byVotesCastDesc";

          case DelegatesOrder.MostDelegates:
            return "byTokenHoldersRepresented";

          case DelegatesOrder.MostVotingPower:
            return "byTokensRepresented";
        }
      })(),
      first,
      after ?? null
    );
  },
};

export type NounModel = RuntimeType<typeof entityDefinitions["Noun"]["serde"]>;

export const Noun: NounResolvers = {
  id({ tokenId }) {
    return `Noun|${tokenId.toString()}`;
  },
};

export type DelegateModel = RuntimeType<
  typeof entityDefinitions["Address"]["serde"]
>;

export const Delegate: DelegateResolvers = {
  id({ address }) {
    return `Delegate|${address}`;
  },

  address({ address }) {
    return { address };
  },

  async statement({ address }, _args, { statementStorage }) {
    const statement = await statementStorage.getStatement(address);
    if (!statement) {
      return null;
    }

    return {
      address: address,
      values: formSchema.parse(JSON.parse(statement.signedPayload)),
    };
  },

  async nounsOwned({ tokensOwnedIds }, _args, { reader }) {
    return await collectGenerator(
      (async function* () {
        for (const tokenId of tokensOwnedIds.map((it) => it.toString())) {
          const noun = await reader.getEntity("Noun", tokenId.toString());
          if (!noun) {
            continue;
          }

          yield noun;
        }
      })()
    );
  },

  async tokenHoldersRepresented({ address }, _args, { reader }) {
    return (
      await collectGenerator(
        reader.getEntitiesByIndex(
          "Address",
          "byDelegatingTo",
          exactIndexValue(address)
        )
      )
    ).map((it) => it.value);
  },

  async proposalVote({ address }, { proposalId }, { reader }) {
    return await reader.getEntity(
      "Vote",
      [proposalId.toString(), address].join("-")
    );
  },

  // todo: limitGenerator
  async nounsRepresented({ address, tokensOwnedIds }, _args, { reader }) {
    const tokenIdsGenerator = (async function* () {
      for await (const addressEntity of reader.getEntitiesByIndex(
        "Address",
        "byDelegatingTo",
        exactIndexValue(address)
      )) {
        for (const tokenId of addressEntity.value.tokensOwnedIds) {
          yield tokenId;
        }
      }
    })();

    return await collectGenerator(
      (async function* () {
        for await (const tokenId of tokenIdsGenerator) {
          const noun = await reader.getEntity("Noun", tokenId.toString());
          if (!noun) {
            continue;
          }

          yield noun;
        }
      })()
    );
  },

  async delegatingTo({ delegatingTo }, _args, { reader }) {
    return (
      (await reader.getEntity("Address", delegatingTo)) ??
      defaultAccount(delegatingTo)
    );
  },

  async delegateMetrics(
    { address, accountsRepresentedCount },
    _args,
    { reader }
  ) {
    const votes = await votesForAddress(reader, address);
    const proposed = await proposedByAddress(reader, address);
    const totalProposals = (await getGovernanceAggregate(reader))
      .totalProposals;

    const lastTenProposals = (
      await collectGenerator(
        limitGenerator(
          filterGenerator(
            reader.getEntitiesByIndex("Proposal", "byEndBlock", {}),
            (value) => value.value.status !== "CANCELLED"
          ),
          10
        )
      )
    ).map((it) => it.value.proposalId.toString());

    const votedProposals = new Set(
      votes.map((vote) => vote.proposalId.toString())
    );

    return {
      tokenHoldersRepresentedCount: accountsRepresentedCount.toNumber(),
      totalVotes: votes.length,
      forVotes: votes.filter((vote) => vote.support === 1).length,
      againstVotes: votes.filter((vote) => vote.support === 0).length,
      abstainVotes: votes.filter((vote) => vote.support === 2).length,
      ofLastTenProps: intersection(votedProposals, new Set(lastTenProposals))
        .size,
      consecutiveVotes: countConsecutiveValues(
        votes.map((vote) => vote.proposalId)
      ),
      ofTotalProps: totalProposals
        ? Math.floor((votes.length / totalProposals) * 100)
        : 0,
      proposalsCreated: proposed.length,
    };
  },

  async proposed({ address }, _args, { reader }) {
    return await proposedByAddress(reader, address);
  },

  async votes({ address }, _args, { reader }) {
    return await votesForAddress(reader, address);
  },

  async delegateSnapshot({ address }, { proposalId }, { reader }) {
    const proposal = await reader.getEntity("Proposal", proposalId);
    if (!proposal) {
      throw new Error("invalid proposal id");
    }

    return await getSnapshotForAddress(address, proposal.startBlock, reader);
  },
};

export type ProposalModel = RuntimeType<
  typeof entityDefinitions["Proposal"]["serde"]
>;

export const Proposal: ProposalResolvers = {
  id({ proposalId }) {
    return `Proposal|${proposalId.toString()}`;
  },

  async proposer({ proposer }, _args, { reader }) {
    return (
      (await reader.getEntity("Address", proposer)) ?? defaultAccount(proposer)
    );
  },

  number({ proposalId }) {
    return proposalId;
  },

  description({ description }) {
    return description;
  },

  transactions({ transactions }) {
    return transactions;
  },

  forVotes({ aggregates: { forVotes } }, _args) {
    return asTokenAmount(forVotes);
  },

  againstVotes({ aggregates: { againstVotes } }, _args) {
    return asTokenAmount(againstVotes);
  },

  abstainVotes({ aggregates: { abstainVotes } }, _args) {
    return asTokenAmount(abstainVotes);
  },

  async voteStartsAt({ startBlock }, _args, { latestBlockFetcher }) {
    return approximateTimeStampForBlock(
      startBlock.toNumber(),
      await latestBlockFetcher.getLatestBlock()
    );
  },

  async voteEndsAt({ endBlock }, _args, { latestBlockFetcher }) {
    return approximateTimeStampForBlock(
      endBlock.toNumber(),
      await latestBlockFetcher.getLatestBlock()
    );
  },

  async quorumVotes({}, _args, { reader }) {
    return {
      amount: await getQuorum(reader),
      ...amountSpec,
    };
  },

  totalValue({ transactions }) {
    return transactions.reduce(
      (acc, tx) => acc.add(tx.value),
      BigNumber.from(0)
    );
  },

  title({ description }) {
    return getTitleFromProposalDescription(description);
  },

  async totalVotes(
    { aggregates: { forVotes, abstainVotes, againstVotes } },
    _args
  ) {
    return forVotes.add(abstainVotes).add(againstVotes);
  },

  async status(
    { proposalId, status, startBlock, endBlock, aggregates },
    _args,
    { reader }
  ) {
    const latestBlock = reader.getLatestBlock();

    switch (status) {
      case "CANCELLED": {
        return ProposalStatus.Cancelled;
      }

      case "EXECUTED": {
        return ProposalStatus.Executed;
      }

      case "PROPOSED": {
        if (latestBlock.blockNumber <= startBlock.toNumber()) {
          return ProposalStatus.Pending;
        }

        if (latestBlock.blockNumber <= endBlock.toNumber()) {
          return ProposalStatus.Active;
        }

        const quorum = await getQuorum(reader);
        const { forVotes, abstainVotes, againstVotes } = aggregates;

        const proposalQuorumVotes = forVotes.add(abstainVotes);

        if (proposalQuorumVotes.lt(quorum)) {
          return ProposalStatus.Defeated;
        }

        if (forVotes.gt(againstVotes)) {
          return ProposalStatus.Queued;
        }

        return ProposalStatus.Defeated;
      }
    }
  },

  async delegateSnapshot({ startBlock }, { address }, { reader }) {
    return await getSnapshotForAddress(address, startBlock, reader);
  },
};

async function getSnapshotForAddress(
  address: string,
  startBlock: BigNumber,
  reader: Reader<typeof entityDefinitions>
): Promise<DelegateSnapshotModel> {
  const snapshot = await takeFirst(
    reader.getEntitiesByIndex("AddressSnapshot", "byDelegatingTo", {
      prefix: {
        indexKey: makeCompoundKey(address, ""),
      },
      starting: {
        indexKey: makeCompoundKey(
          address,
          efficientLengthEncodingNaturalNumbers(startBlock.mul(-1))
        ),
      },
    })
  );

  if (!snapshot) {
    return {
      tokensRepresentedIds: [],
    };
  }

  return {
    tokensRepresentedIds: snapshot.value.tokensRepresentedIds,
  };
}

export type ProposalTransactionModel = RuntimeType<
  typeof entityDefinitions["Proposal"]["serde"]
>["transactions"][0];

export const ProposalTransaction: ProposalTransactionResolvers = {
  target({ target }) {
    return {
      address: target,
    };
  },
};

export type VoteModel = RuntimeType<typeof entityDefinitions["Vote"]["serde"]>;

export const Vote: VoteResolvers = {
  id({ id }) {
    return `Vote|${id}`;
  },

  async proposal({ proposalId }, _args, { reader }) {
    return (await reader.getEntity("Proposal", proposalId.toString()))!;
  },

  reason({ reason }) {
    return reason;
  },

  supportDetailed({ support }) {
    return support;
  },

  async approximateTimestamp({ blockNumber }, _args, { latestBlockFetcher }) {
    return approximateTimeStampForBlock(
      blockNumber,
      await latestBlockFetcher.getLatestBlock()
    );
  },

  votes({ weight }) {
    return weight;
  },
  async voter({ voterAddress }, _args, { reader }) {
    return (
      (await reader.getEntity("Address", voterAddress)) ??
      defaultAccount(voterAddress)
    );
  },
};

export type DelegateSnapshotModel = {
  tokensRepresentedIds: BigNumber[];
};

export const DelegateSnapshot: DelegateSnapshotResolvers = {
  async nounsRepresented({ tokensRepresentedIds }, _args, { reader }) {
    return await collectGenerator(
      (async function* () {
        for (const tokenId of tokensRepresentedIds.map((it) => it.toString())) {
          const noun = await reader.getEntity("Noun", tokenId.toString());
          if (!noun) {
            continue;
          }

          yield noun;
        }
      })()
    );
  },
};

async function votesForAddress(
  reader: Reader<typeof entityDefinitions>,
  address: string
) {
  const normalizedAddress = ethers.utils.getAddress(address);
  return await collectGenerator(
    (async function* () {
      for await (const { value } of reader.getEntitiesByIndex(
        "Vote",
        "byVoter",
        exactIndexValue(normalizedAddress)
      )) {
        if (value.voterAddress !== normalizedAddress) {
          return;
        }

        yield value;
      }
    })()
  );
}

async function proposedByAddress(
  reader: Reader<typeof entityDefinitions>,
  address: string
) {
  const normalizedAddress = ethers.utils.getAddress(address);
  return await collectGenerator(
    (async function* () {
      for await (const { value } of reader.getEntitiesByIndex(
        "Proposal",
        "byProposer",
        exactIndexValue(normalizedAddress)
      )) {
        if (value.proposer !== normalizedAddress) {
          return;
        }

        yield value;
      }
    })()
  );
}

async function getQuorum(
  reader: Reader<typeof entityDefinitions>
): Promise<BigNumber> {
  const governorAggregates = await getGovernanceAggregate(reader);
  const aggregate = await getAggregate(reader);

  return aggregate.totalSupply
    .mul(governorAggregates.quorumFloorBps)
    .div(quorumDenominator);
}

async function getAggregate(reader: Reader<typeof entityDefinitions>) {
  return (
    (await reader.getEntity("Aggregates", aggregateCumulativeId)) ??
    makeDefaultAggregate()
  );
}

async function getGovernanceAggregate(
  reader: Reader<typeof entityDefinitions>
) {
  return (
    (await reader.getEntity("GovernorAggregates", governanceAggregatesKey)) ??
    makeDefaultGovernanceAggregate()
  );
}

function bpsOf(top: BigNumber, bottom: BigNumber): number {
  if (bottom.eq(BigNumber.from(0))) {
    return 0;
  }

  return Math.round(
    top
      .mul(100 * 100)
      .div(bottom)
      .toNumber()
  );
}

function asTokenAmount(amount: BigNumber) {
  return {
    amount,
    ...amountSpec,
  };
}

async function bpsOfSupply(
  bps: number,
  reader: Reader<typeof entityDefinitions>
) {
  const aggregate = await getAggregate(reader);
  return aggregate.totalSupply.mul(bps).div(100 * 100);
}

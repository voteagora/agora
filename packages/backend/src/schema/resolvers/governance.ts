import {
  DelegateResolvers,
  DelegatesOrder,
  MetricsResolvers,
  ProposalResolvers,
  ProposalStatus,
  QueryResolvers,
  VoteResolvers,
  VotingPowerResolvers,
} from "./generated/types";
import { BigNumber, ethers } from "ethers";
import {
  governanceAggregatesKey,
  makeDefaultGovernanceAggregate,
} from "../../indexer/contracts/OptimismGovernorV1";
import {
  aggregateCumulativeId,
  defaultAccount,
  makeDefaultAggregate,
} from "../../indexer/contracts/GovernanceToken";
import { Reader } from "../../indexer/storage/reader";
import { entityDefinitions } from "../../indexer/contracts";
import { RuntimeType } from "../../indexer/serde";
import { collectGenerator } from "../../indexer/utils/generatorUtils";
import { getTitleFromProposalDescription } from "../../utils/markdown";
import { driveReaderByIndex } from "../pagination";
import { formSchema } from "../../formSchema";
import { approximateBlockTimestampForBlock } from "../../utils/blockTimestamp";

const amountSpec = {
  currency: "OP",
  decimals: 18,
};

const quorumDenominator = BigNumber.from(100000);

export type VotingPowerModel = BigNumber;

export const VotingPower: VotingPowerResolvers = {
  amount(value) {
    return {
      amount: value,
      ...amountSpec,
    };
  },

  async bpsOfTotal(value, _args, { reader }) {
    const aggregate = await getAggregate(reader);

    return bpsOf(value, aggregate.totalSupply);
  },

  async bpsOfQuorum(value, _args, { reader }) {
    const quorum = await getQuorum(reader);
    return bpsOf(value, quorum);
  },
};

export type MetricsModel = {};

export const Metrics: MetricsResolvers = {
  async proposalThreshold(_parent, _args, { reader }) {
    const governorAggregates = await getGovernanceAggregate(reader);
    return governorAggregates.proposalThreshold;
  },
  async delegatedSupply(_parent, _args, { reader }) {
    const aggregate = await getAggregate(reader);
    return {
      amount: aggregate.delegatedSupply,
      ...amountSpec,
    };
  },
  async totalSupply(_parent, _args, { reader }) {
    const aggregate = await getAggregate(reader);

    return {
      amount: aggregate.totalSupply,
      ...amountSpec,
    };
  },
  quorum(_parent, _args, { reader }) {
    return getQuorum(reader);
  },
};

export const Query: QueryResolvers = {
  async delegate(_, { addressOrEnsName }, { ethProvider, reader }) {
    const address = await ethProvider.resolveName(addressOrEnsName);
    if (!address) {
      throw new Error("failed to resolve address");
    }

    return (
      (await reader.getEntity("Address", address)) ?? defaultAccount(address)
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
        reader.getEntitiesByIndex("Proposal", "byEndBlock", {
          type: "RANGE",
        })
      )
    ).map((it) => it.value);
  },

  async delegates(_, { orderBy, first, where, after }, { reader }) {
    return await driveReaderByIndex(
      reader,
      "Address",
      (() => {
        switch (orderBy) {
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

  amountOwned({ tokensOwned }) {
    return tokensOwned;
  },

  tokensRepresented({ tokensRepresented }) {
    return tokensRepresented;
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

    return {
      tokenHoldersRepresentedCount: accountsRepresentedCount.toNumber(),
      totalVotes: votes.length,
      forVotes: votes.filter((vote) => vote.support === 1).length,
      againstVotes: votes.filter((vote) => vote.support === 0).length,
      abstainVotes: votes.filter((vote) => vote.support === 2).length,
      // todo: implement ofLastTenProps
      ofLastTenProps: 0,
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

  async snapshotVotes({ address }, _args, { snapshotVoteStorage }) {
    return await snapshotVoteStorage.getSnapshotVotesByVoter(address);
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

  calldatas({ transactions }) {
    return transactions.map((tx) => tx.calldata);
  },

  values({ transactions }) {
    return transactions.map((tx) => tx.value);
  },

  targets({ transactions }) {
    return transactions.map((tx) => tx.target);
  },

  signatures({ transactions }) {
    return [];
  },

  async votes({ proposalId }, _args, { reader }) {
    return await proposalVotes(proposalId, reader);
  },

  // todo: avoid re-querying these
  async forVotes({ proposalId }, _args, { reader }) {
    return await countVotesWithStatus(proposalId, 1, reader);
  },

  async againstVotes({ proposalId }, _args, { reader }) {
    return await countVotesWithStatus(proposalId, 0, reader);
  },

  async abstainVotes({ proposalId }, _args, { reader }) {
    return await countVotesWithStatus(proposalId, 2, reader);
  },

  async voteStartsAt({ startBlock }, _args, { provider }) {
    return approximateBlockTimestampForBlock(provider, startBlock.toNumber());
  },

  async voteEndsAt({ endBlock }, _args, { provider }) {
    return approximateBlockTimestampForBlock(provider, endBlock.toNumber());
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

  async totalVotes({ proposalId }, _args, { reader }) {
    const votes = await proposalVotes(proposalId, reader);
    return BigNumber.from(votes.length);
  },

  async status(
    { proposalId, status, startBlock, endBlock },
    _args,
    { provider, reader }
  ) {
    const latestBlock = await provider.getBlock("latest");

    switch (status) {
      case "CANCELLED": {
        return ProposalStatus.Cancelled;
      }

      case "EXECUTED": {
        return ProposalStatus.Executed;
      }

      case "PROPOSED": {
        if (startBlock.toNumber() >= latestBlock.number) {
          return ProposalStatus.Pending;
        }

        if (endBlock.toNumber() >= latestBlock.number) {
          return ProposalStatus.Active;
        }

        // todo: constants for vote type
        const quorum = await getQuorum(reader);
        const votes = await proposalVotes(proposalId, reader);
        const forVotes = votes
          .filter((vote) => vote.support === 1 || vote.support === 1)
          .reduce((acc, value) => value.weight.add(acc), BigNumber.from(0));

        const abstainVotes = votes
          .filter((vote) => vote.support === 1 || vote.support === 2)
          .reduce((acc, value) => value.weight.add(acc), BigNumber.from(0));

        const againstVotes = votes
          .filter((vote) => vote.support === 1 || vote.support === 0)
          .reduce((acc, value) => value.weight.add(acc), BigNumber.from(0));

        const proposalQuorumVotes = forVotes.add(abstainVotes);

        if (proposalQuorumVotes.lt(quorum)) {
          return ProposalStatus.Defeated;
        }

        if (forVotes.gt(againstVotes)) {
          return ProposalStatus.Defeated;
        }

        return ProposalStatus.Queued;
      }
    }
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

  // todo: missing fields
  // @ts-ignore
  transaction({ blockHash, transactionHash }) {
    return { blockHash, transactionHash };
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
        {
          type: "EXACT_MATCH",
          indexKey: normalizedAddress,
        }
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
        { type: "EXACT_MATCH", indexKey: normalizedAddress }
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
    .mul(governorAggregates.quorumNumerator)
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

async function proposalVotes(
  id: BigNumber,
  reader: Reader<typeof entityDefinitions>
) {
  return (
    await collectGenerator(
      reader.getEntitiesByIndex("Vote", "byProposal", {
        type: "EXACT_MATCH",
        indexKey: id.toString(),
      })
    )
  ).map((it) => it.value);
}

async function countVotesWithStatus(
  proposalId: BigNumber,
  support: number,
  reader: Reader<typeof entityDefinitions>
) {
  const votes = await proposalVotes(proposalId, reader);
  const amount = votes
    .filter((it) => it.support === support)
    .reduce((acc, value) => acc.add(value.weight), BigNumber.from(0));

  return {
    ...amountSpec,
    amount,
  };
}

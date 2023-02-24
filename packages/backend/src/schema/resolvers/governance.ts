import {
  DelegateResolvers,
  DelegatesOrder,
  MetricsResolvers,
  ProposalResolvers,
  ProposalStatus,
  QueryResolvers,
  VoteResolvers,
  VotingPowerResolvers,
} from "../generated/types";
import { BigNumber, ethers } from "ethers";
import {
  governanceAggregatesKey,
  makeDefaultGovernanceAggregate,
} from "../../indexer/contracts/ENSGovernor";
import {
  aggregateCumulativeId,
  defaultAccount,
  makeDefaultAggregate,
} from "../../indexer/contracts/GovernanceToken";
import { exactIndexValue, Reader } from "../../indexer/storage/reader";
import { entityDefinitions } from "../../indexer/contracts";
import { RuntimeType } from "../../indexer/serde";
import { collectGenerator } from "../../indexer/utils/generatorUtils";
import { getTitleFromProposalDescription } from "../../utils/markdown";
import { driveReaderByIndex } from "../pagination";
import { formSchema } from "../../formSchema";
import { approximateBlockTimestampForBlock } from "../../utils/blockTimestamp";
import { makeCompoundKey } from "../../indexer/indexKey";

const amountSpec = {
  currency: "ENS",
  decimals: 18,
};

const quorumDenominator = BigNumber.from(10000);

export type VotingPowerModel = BigNumber;

export const VotingPower: VotingPowerResolvers = {
  amount(value) {
    return asTokenAmount(value);
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
  proposalThreshold() {
    return ethers.BigNumber.from("100000000000000000000000");
  },
  async delegatedSupply(_parent, _args, { reader }) {
    const aggregate = await getAggregate(reader);

    console.log(aggregate);

    return asTokenAmount(aggregate.delegatedSupply);
  },
  async totalSupply(_parent, _args, { reader }) {
    const aggregate = await getAggregate(reader);
    return asTokenAmount(aggregate.totalSupply);
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

  async statement({ address }, _args, { delegateStorage }) {
    const delegate = await delegateStorage.getDelegate(address);

    if (!delegate || !delegate.statement || !delegate.statement.signedPayload) {
      return null;
    }

    return {
      address: address,
      values: formSchema.parse(JSON.parse(delegate.statement.signedPayload)),
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

  forVotes({ aggregates: { forVotes } }, _args) {
    return asTokenAmount(forVotes);
  },

  againstVotes({ aggregates: { againstVotes } }, _args) {
    return asTokenAmount(againstVotes);
  },

  abstainVotes({ aggregates: { abstainVotes } }, _args) {
    return asTokenAmount(abstainVotes);
  },

  async voteStartsAt({ startBlock }, _args, { provider }) {
    return approximateBlockTimestampForBlock(provider, startBlock.toNumber());
  },

  async voteEndsAt({ endBlock }, _args, { provider }) {
    return approximateBlockTimestampForBlock(provider, endBlock.toNumber());
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
        if (startBlock.toNumber() >= latestBlock.blockNumber) {
          return ProposalStatus.Pending;
        }

        if (endBlock.toNumber() >= latestBlock.blockNumber) {
          return ProposalStatus.Active;
        }

        const quorum = await getQuorum(reader);
        const { forVotes, abstainVotes, againstVotes } = aggregates;

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

  async transaction({ transactionHash }, _args, { provider }) {
    return await provider.getTransaction(transactionHash);
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

function asTokenAmount(amount: BigNumber) {
  return {
    amount,
    ...amountSpec,
  };
}

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
import { BigNumber } from "ethers";
import { governanceAggregatesKey } from "../../indexer/contracts/OptimismGovernorV1";
import { aggregateCumulativeId } from "../../indexer/contracts/GovernanceToken";
import { Reader } from "../../indexer/reader";
import { entityDefinitions } from "../../indexer/contracts";
import { RuntimeType } from "../../indexer/serde";
import { ethers } from "ethers";
import { collectGenerator } from "../../indexer/utils/generatorUtils";
import { getTitleFromProposalDescription } from "../../utils/markdown";
import { driveReaderByIndex } from "../pagination";

const amountSpec = {
  currency: "OP",
  decimals: 18,
};

const quorumDenominator = BigNumber.from(100);

export type VotingPowerModel = BigNumber;

export const VotingPower: VotingPowerResolvers = {
  amount(value) {
    return {
      amount: value,
      ...amountSpec,
    };
  },

  async bpsOfTotal(value, _args, { reader }) {
    const aggregate = (await reader.getEntity(
      "Aggregates",
      aggregateCumulativeId
    ))!;

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
  async delegate(_, { addressOrEnsName }, { provider, reader }) {
    const address = await provider.resolveName(addressOrEnsName);
    if (!address) {
      return null;
    }

    const addressEntity = await reader.getEntity("Address", address);
    if (!addressEntity) {
      return null;
    }

    return addressEntity;
  },

  metrics() {
    return {};
  },

  async proposal(_, { id }, { reader }) {
    return (await reader.getEntity("Proposal", id))!;
  },

  async proposals(_, {}, { reader }) {
    return await collectGenerator(
      reader.getEntitiesByIndex("Proposal", "byEndBlock", {
        type: "RANGE",
      })
    );
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
      after
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

  statement({ address }, _args) {
    // todo: implement
    return null;
  },

  amountOwned({ tokensOwned }) {
    return tokensOwned;
  },

  tokensRepresented({ tokensRepresented }) {
    return tokensRepresented;
  },

  async delegateMetrics({ address, accountsRepresented }, _args, { reader }) {
    const votes = await votesForAddress(reader, address);
    const proposed = await proposedByAddress(reader, address);
    const totalProposals = (await getGovernanceAggregate(reader))
      .totalProposals;

    return {
      tokenHoldersRepresentedCount: accountsRepresented.length,
      totalVotes: votes.length,
      forVotes: votes.filter((vote) => vote.support === 1).length,
      againstVotes: votes.filter((vote) => vote.support === 0).length,
      abstainVotes: votes.filter((vote) => vote.support === 2).length,
      // todo: implement ofLastTenProps
      ofLastTenProps: 0,
      ofTotalProps: Math.floor((votes.length / totalProposals) * 100),
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
    return (await reader.getEntity("Address", proposer))!;
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
    return await collectGenerator(
      reader.getEntitiesByIndex("Vote", "byProposal", {
        type: "EXACT_MATCH",
        indexKey: proposalId.toString(),
      })
    );
  },

  forVotes() {
    // todo: implement
    return BigNumber.from(0);
  },

  againstVotes() {
    // todo: implement
    return BigNumber.from(0);
  },

  abstainVotes() {
    // todo: implement
    return BigNumber.from(0);
  },

  voteStartsAt({ startBlock }) {
    return startBlock.toNumber();
  },

  voteEndsAt({ endBlock }) {
    return endBlock.toNumber();
  },

  quorumVotes() {
    // todo: quorum for proposal
    return BigNumber.from(0);
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

  totalVotes() {
    // todo: implement
    return BigNumber.from(0);
  },

  status({ status }) {
    // todo: implement
    return ProposalStatus.Pending;
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
  transaction({ blockHash, transactionHash }) {
    return { blockHash, transactionHash };
  },

  votes({ weight }) {
    return weight;
  },
  async voter({ voterAddress }, _args, { reader }) {
    return (await reader.getEntity("Address", voterAddress))!;
  },
};

async function votesForAddress(
  reader: Reader<typeof entityDefinitions>,
  address: string
) {
  const normalizedAddress = ethers.utils.getAddress(address);
  return await collectGenerator(
    (async function* () {
      for await (const value of reader.getEntitiesByIndex("Vote", "byVoter", {
        type: "EXACT_MATCH",
        indexKey: normalizedAddress,
      })) {
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
  // todo: simplify this
  return await collectGenerator(
    (async function* () {
      for await (const value of reader.getEntitiesByIndex(
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
  const governorAggregates = (await reader.getEntity(
    "GovernorAggregates",
    governanceAggregatesKey
  ))!;

  const aggregate = (await reader.getEntity(
    "Aggregates",
    aggregateCumulativeId
  ))!;

  return aggregate.totalSupply
    .mul(governorAggregates.quorumNumerator)
    .div(quorumDenominator);
}

async function getAggregate(reader: Reader<typeof entityDefinitions>) {
  return (await reader.getEntity("Aggregates", aggregateCumulativeId))!;
}

async function getGovernanceAggregate(
  reader: Reader<typeof entityDefinitions>
) {
  return (await reader.getEntity(
    "GovernorAggregates",
    governanceAggregatesKey
  ))!;
}

function bpsOf(top: BigNumber, bottom: BigNumber) {
  return Math.round(
    top
      .mul(100 * 100)
      .div(bottom)
      .toNumber()
  );
}

// todo: early materializing joins?
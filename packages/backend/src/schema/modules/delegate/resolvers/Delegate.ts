import { Resolvers } from "../module";
import {
  collectGenerator,
  filterGenerator,
  limitGenerator,
} from "../../../../shared/utils/generatorUtils";
import { exactIndexValue } from "../../../../shared/indexer/storage/indexQueryArgs";
import { intersection } from "../../../../shared/utils/set";
import { countConsecutiveValues } from "../../../../shared/utils/countConsecutiveValues";
import { votesForAddress } from "../../../../shared/contracts/indexers/IGovernor/entities/vote";
import { proposedByAddress } from "../../../../shared/contracts/indexers/IGovernor/entities/proposal";
import { loadGovernanceAggregate } from "../../../../shared/contracts/indexers/IGovernor/entities/aggregate";

export type DelegateModel = { address: string };

export const Delegate: Resolvers["Delegate"] = {
  id({ address }) {
    return `Delegate|${address}`;
  },

  async tokensOwned({ address }, _args, { accountLoader }) {
    const account = await accountLoader.loadAccount(address);
    return account.tokensOwned;
  },

  async tokensRepresented({ address }, _args, { accountLoader }) {
    const account = await accountLoader.loadAccount(address);
    return account.tokensRepresented;
  },

  address({ address }) {
    return { address };
  },

  async tokenHoldersRepresented({ address }, _args, { reader }) {
    return (
      await collectGenerator(
        reader.getEntitiesByIndex(
          "IVotesAddress",
          "byDelegatingTo",
          exactIndexValue(address)
        )
      )
    ).map((it) => ({
      address: it.value.address,
    }));
  },

  async proposalVote({ address }, { proposalId }, { reader }) {
    return await reader.getEntity(
      "IGovernorVote",
      [proposalId.toString(), address].join("-")
    );
  },

  async delegatingTo({ address }, _args, { accountLoader }) {
    const { delegatingTo } = await accountLoader.loadAccount(address);
    return accountLoader.loadAccount(delegatingTo);
  },

  async delegateMetrics({ address }, _args, { reader, accountLoader }) {
    const { accountsRepresentedCount } = await accountLoader.loadAccount(
      address
    );

    const votes = await votesForAddress(reader, address);
    const proposed = await proposedByAddress(reader, address);
    const totalProposals = (await loadGovernanceAggregate(reader))
      .totalProposals;

    const lastTenProposals = (
      await collectGenerator(
        limitGenerator(
          filterGenerator(
            reader.getEntitiesByIndex("IGovernorProposal", "byEndBlock", {}),
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
      tokenHoldersRepresentedCount: Number(accountsRepresentedCount),
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

  async delegateSnapshot({ address }, { proposalId }) {
    return { address, proposalId: BigInt(proposalId) };
  },
};

export type DelegateSnapshotModel = {
  address: string;
  proposalId: bigint;
};

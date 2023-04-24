import { approximateTimeStampForBlock } from "../../../../shared/utils/blockTimestamp";
import { getTitleFromProposalDescription } from "../../../../utils/markdown";
import { EntityRuntimeType } from "../../../../shared/indexer/process/process";
import {
  IGovernorProposal,
  proposalStatus,
} from "../../../../shared/contracts/indexers/IGovernor/entities/proposal";
import { Resolvers } from "../module";

export type ProposalModel = EntityRuntimeType<typeof IGovernorProposal>;

export const Proposal: Resolvers["Proposal"] = {
  id({ proposalId }) {
    return `Proposal|${proposalId.toString()}`;
  },

  async proposer({ proposer }, _args, { reader }) {
    return {
      address: proposer,
    };
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
    return forVotes;
  },

  againstVotes({ aggregates: { againstVotes } }, _args) {
    return againstVotes;
  },

  abstainVotes({ aggregates: { abstainVotes } }, _args) {
    return abstainVotes;
  },

  async voteStartsAt({ startBlock }, _args, { latestBlockFetcher }) {
    return approximateTimeStampForBlock(
      Number(startBlock),
      await latestBlockFetcher.getLatestBlock()
    );
  },

  async voteEndsAt({ endBlock }, _args, { latestBlockFetcher }) {
    return approximateTimeStampForBlock(
      Number(endBlock),
      await latestBlockFetcher.getLatestBlock()
    );
  },

  async quorumVotes({}, _args, { quorumFetcher }) {
    return quorumFetcher.fetchQuorum();
  },

  totalValue({ transactions }) {
    return transactions.reduce((acc, tx) => acc + tx.value, 0n);
  },

  title({ description }) {
    return getTitleFromProposalDescription(description);
  },

  async totalVotes(
    { aggregates: { forVotes, abstainVotes, againstVotes } },
    _args
  ) {
    return forVotes + abstainVotes + againstVotes;
  },

  async status(proposal, _args, { reader, quorumFetcher }) {
    const currentBlockNumber = await reader.getLatestBlock();
    return await proposalStatus(
      proposal,
      currentBlockNumber.blockNumber,
      quorumFetcher
    );
  },

  delegateSnapshot({ proposalId }, { address }, { reader }) {
    return {
      proposalId,
      address,
    };
  },
};

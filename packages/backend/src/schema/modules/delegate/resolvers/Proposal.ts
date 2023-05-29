import { approximateTimeStampForBlock } from "../../../../shared/utils/blockTimestamp";
import { getTitleFromProposalDescription } from "../../../../utils/markdown";
import { EntityRuntimeType } from "../../../../shared/indexer/process/process";
import {
  IGovernorProposal,
  proposalStatus,
} from "../../../../shared/contracts/indexers/IGovernor/entities/proposal";
import { Resolvers } from "../module";
import { decodeUSDCTransaction } from "../../../../utils/decodeUSDC";

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

  quorumVotes({ proposalId }, _args, { quorumFetcher }) {
    return quorumFetcher.fetchQuorum(proposalId);
  },

  totalValue({ transactions }) {
    return transactions.reduce((acc, tx) => acc + tx.value, 0n);
  },

  ethValue({ transactions }) {
    return transactions.reduce((acc, tx) => {
      if (tx.target !== "0x4f2aCdc74f6941390d9b1804faBc3E780388cfe5") {
        return acc + tx.value;
      }
      return acc;
    }, 0n);
  },

  usdcValue({ transactions }) {
    return transactions.reduce((acc, tx) => {
      if (tx.target === "0xd97Bcd9f47cEe35c0a9ec1dc40C1269afc9E8E1D") {
        const decoded = decodeUSDCTransaction(tx.signature, tx.calldata);
        if (decoded && decoded.amount) {
          return acc + decoded.amount.toBigInt();
        }
      }
      return acc;
    }, 0n);
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

import { approximateTimeStampForBlock } from "../../../../shared/utils/blockTimestamp";
import { EntityRuntimeType } from "../../../../shared/indexer/process/process";
import { IGovernorVote } from "../../../../shared/contracts/indexers/IGovernor/entities/vote";
import { Resolvers } from "../module";
import { loadProposal } from "../../../../shared/contracts/indexers/IGovernor/entities/proposal";

export type VoteModel = EntityRuntimeType<typeof IGovernorVote>;

export const Vote: Resolvers["Vote"] = {
  id({ id }) {
    return `Vote|${id}`;
  },

  async proposal({ proposalId }, _args, { reader }) {
    return loadProposal(reader, proposalId);
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
    return {
      address: voterAddress,
    };
  },
};

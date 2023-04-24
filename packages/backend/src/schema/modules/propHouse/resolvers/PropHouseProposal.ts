import { z } from "zod";

import { proposal } from "../api/common";
import { Resolvers } from "../module";

export type PropHouseProposalModel = z.infer<typeof proposal>;

export const PropHouseProposal: Resolvers["PropHouseProposal"] = {
  id({ id }) {
    return `PropHouseProposal|${id}`;
  },

  number({ id }) {
    return id;
  },

  title({ title }) {
    return title;
  },

  tldr({ tldr }) {
    return tldr;
  },

  createdDate({ createdDate }) {
    return createdDate;
  },

  voteCount({ voteCount }) {
    return voteCount;
  },

  proposer({ address }) {
    return { address };
  },
};

import { IVotesAggregate } from "../../IVotes/entities/aggregate";
import { IVotesAddress } from "../../ERC721Votes/entities/address";

import { IGovernorVote } from "./vote";
import { IGovernorProposal } from "./proposal";
import { IGovernorAggregate } from "./aggregate";

export const IGovernorEntities = {
  IVotesAggregate,
  IGovernorVote,
  IGovernorProposal,
  IGovernorAggregate,
  IVotesAddress,
};

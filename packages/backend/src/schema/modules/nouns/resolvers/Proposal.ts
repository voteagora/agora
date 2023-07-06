import { ProposalResolvers } from "../../../generated-types/graphql";

import { PropHouseProposalTypeModel } from "./PropHouseProposalType";
import { OnChainProposalTypeModel } from "./OnChainProposalType";

export type ProposalModel =
  | PropHouseProposalTypeModel
  | OnChainProposalTypeModel;

export const Proposal: ProposalResolvers = {
  id(proposal) {
    switch (proposal.type) {
      case "ON_CHAIN":
        return `OnChainProposalType|${proposal.proposal.entityId}`;

      case "PROP_HOUSE":
        return `PropHouseProposalType|${proposal.auction.id}`;
    }
  },

  __resolveType(proposal) {
    switch (proposal.type) {
      case "ON_CHAIN":
        return "OnChainProposalType";

      case "PROP_HOUSE":
        return "PropHouseProposalType";
    }
  },
};

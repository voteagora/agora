import { Resolvers } from "../module";
import { PropHouseAuctionModel } from "../../propHouse/resolvers/PropHouseAuction";

export type PropHouseProposalTypeModel = {
  type: "PROP_HOUSE";
  auction: PropHouseAuctionModel;
};

export const PropHouseProposalType: Resolvers["PropHouseProposalType"] = {
  id({ auction }) {
    return auction.id.toString();
  },

  propHouseProposal({ auction }) {
    return auction;
  },
};

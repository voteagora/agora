import { Resolvers } from "../module";
import { IndexedValue } from "../../../../shared/indexer/storage/reader/type";
import { EntityRuntimeType } from "../../../../shared/indexer/process/process";
import { IGovernorProposal } from "../../../../shared/contracts/indexers/IGovernor/entities/proposal";

export type OnChainProposalTypeModel = {
  type: "ON_CHAIN";
  proposal: IndexedValue<EntityRuntimeType<typeof IGovernorProposal>>;
};

export const OnChainProposalType: Resolvers["OnChainProposalType"] = {
  id({ proposal }) {
    return proposal.entityId;
  },

  onChainProposal({ proposal }) {
    return proposal.value;
  },
};

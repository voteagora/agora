import { EntityRuntimeType } from "../../../../shared/indexer/process/process";
import { IGovernorProposal } from "../../../../shared/contracts/indexers/IGovernor/entities/proposal";
import { Resolvers } from "../module";

export type ProposalTransactionModel = EntityRuntimeType<
  typeof IGovernorProposal
>["transactions"][0];

export const ProposalTransaction: Resolvers["ProposalTransaction"] = {
  target({ target }) {
    return {
      address: target,
    };
  },
};

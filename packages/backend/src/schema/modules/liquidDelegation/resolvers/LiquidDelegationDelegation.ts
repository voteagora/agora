import { ResolvedRules } from "../../../../shared/contracts/indexers/Alligator/entities/resolvedRules";
import { Resolvers } from "../module";

export type LiquidDelegationDelegationModel = {
  to: string;
  rules: ResolvedRules;
};

export const LiquidDelegationDelegation: Resolvers["LiquidDelegationDelegation"] =
  {
    to({ to }) {
      return { address: to };
    },
  };

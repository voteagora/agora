import { ResolvedRules } from "../../../../shared/contracts/indexers/Alligator/entities/resolvedRules";
import {
  PERMISSION_PROPOSE,
  PERMISSION_SIGN,
  PERMISSION_VOTE,
} from "../../../../shared/contracts/indexers/Alligator/entities/rules";
import { Resolvers } from "../module";

export type LiquidDelegationRulesModel = ResolvedRules;

export const LiquidDelegationRules: Resolvers["LiquidDelegationRules"] = {
  permissionVote({ permissions }) {
    return !!(permissions & PERMISSION_VOTE);
  },

  permissionSign({ permissions }) {
    return !!(permissions & PERMISSION_SIGN);
  },

  permissionPropose({ permissions }) {
    return !!(permissions & PERMISSION_PROPOSE);
  },
};

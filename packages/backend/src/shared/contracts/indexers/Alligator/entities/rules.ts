import { ethers } from "ethers";

import { serde } from "../../../../indexer";
import { AbiRulesType } from "../AlligatorAbi";

export const rules = serde.object({
  permissions: serde.number,
  maxRedelegations: serde.number,
  notValidBefore: serde.number,
  notValidAfter: serde.number,
  blocksBeforeVoteCloses: serde.number,
  customRule: serde.string,
});

export type RulesType = serde.RuntimeType<typeof rules>;

export function toRules([
  permissions,
  maxRedelegations,
  notValidBefore,
  notValidAfter,
  blocksBeforeVoteCloses,
  customRule,
]: AbiRulesType): RulesType {
  return {
    permissions,
    maxRedelegations,
    notValidBefore,
    notValidAfter,
    blocksBeforeVoteCloses,
    customRule,
  };
}

export function makeDefaultRules(): RulesType {
  return {
    permissions: PERMISSION_PROPOSE | PERMISSION_SIGN,
    customRule: ethers.constants.AddressZero,
    maxRedelegations: 0,
    notValidAfter: 0,
    notValidBefore: 0,
    blocksBeforeVoteCloses: 0,
  };
}
export const PERMISSION_VOTE = 0b001;
export const PERMISSION_SIGN = 0b010;
export const PERMISSION_PROPOSE = 0b100;

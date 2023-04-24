import { ethers } from "ethers";

import { RulesType } from "./rules";

export function calculateResolvedRules(
  authorityChain: (RulesType | null)[]
): ResolvedRules {
  return authorityChain.reduce((resolvedRules, rules) => {
    if (!rules) {
      return resolvedRules;
    }

    return {
      permissions: resolvedRules.permissions & rules.permissions,
      notValidAfter: (() => {
        const sentinel = Infinity;
        const notValidAfterRaw = Math.min(
          resolvedRules.notValidAfter?.getTime() ?? sentinel,
          rules.notValidAfter || sentinel
        );

        if (notValidAfterRaw === sentinel) {
          return null;
        }

        return new Date(notValidAfterRaw * 1000);
      })(),
      notValidBefore: (() => {
        const sentinel = -Infinity;
        const notValidBeforeRaw = Math.max(
          resolvedRules.notValidBefore?.getTime() ?? sentinel,
          rules.notValidBefore || sentinel
        );

        if (notValidBeforeRaw === sentinel) {
          return null;
        }

        return new Date(notValidBeforeRaw * 1000);
      })(),
      customRules: [
        ...resolvedRules.customRules,
        ...(() => {
          if (rules.customRule === ethers.constants.AddressZero) {
            return [];
          }

          return [rules.customRule];
        })(),
      ],
      blocksBeforeVoteCloses: Math.min(
        resolvedRules.blocksBeforeVoteCloses,
        rules.blocksBeforeVoteCloses
      ),
      maxRedelegations: Math.min(
        resolvedRules.maxRedelegations - 1,
        rules.maxRedelegations
      ),
    };
  }, permissiveResolvedRules());
}

function permissiveResolvedRules(): ResolvedRules {
  return {
    permissions: 0xff,
    customRules: [],
    notValidAfter: null,
    notValidBefore: null,
    blocksBeforeVoteCloses: 0,
    maxRedelegations: 0xff,
  };
}

export type ResolvedRules = {
  permissions: number;
  customRules: string[];
  notValidAfter: Date | null;
  notValidBefore: Date | null;
  blocksBeforeVoteCloses: number;
  maxRedelegations: number;
};

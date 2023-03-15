import { RuntimeType } from "../../../indexer/serde";
import { entityDefinitions } from "../../../indexer/contracts/entityDefinitions";
import { ethers } from "ethers";
import { IRule__factory } from "../../../contracts/generated/factories/IRule__factory";
import { daoContract } from "../../../indexer/contracts/NounsDAO";

export function calculateResolvedRules(
  authorityChain: (Rules | null)[]
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

export function checkTimePermission(resolvedRules: ResolvedRules, time: Date) {
  if (resolvedRules.notValidBefore && time < resolvedRules.notValidBefore) {
    return false;
  }

  if (resolvedRules.notValidAfter && time > resolvedRules.notValidAfter) {
    return false;
  }

  return true;
}

export async function checkCustomRule(
  customRule: string,
  voter: string,
  proposalId: ethers.BigNumber,
  support: "FOR" | "AGAINST" | "ABSTAIN",
  provider: ethers.providers.Provider
) {
  const iface = IRule__factory.createInterface();
  const validateSighash = iface.getSighash(
    iface.functions["validate(address,address,uint256,uint8)"]
  );

  const irule = IRule__factory.connect(customRule, provider);

  const possibleSelector = await irule.validate(
    daoContract.address,
    voter,
    proposalId,
    support
  );

  return possibleSelector == validateSighash;
}

export async function checkBlocksBeforeVoteCloses(
  resolvedRule: ResolvedRules,
  proposal: RuntimeType<typeof entityDefinitions["Proposal"]["serde"]>,
  blockNumber: number
) {
  if (!resolvedRule.blocksBeforeVoteCloses) {
    return true;
  }

  return proposal.endBlock.lte(
    blockNumber + resolvedRule.blocksBeforeVoteCloses
  );
}

export type Rules = RuntimeType<
  typeof entityDefinitions["AlligatorSubDelegation"]["serde"]
>["rules"];

export type ResolvedRules = {
  permissions: number;
  customRules: string[];
  notValidAfter: Date | null;
  notValidBefore: Date | null;
  blocksBeforeVoteCloses: number;
  maxRedelegations: number;
};

export function makeDefaultRules(): Rules {
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

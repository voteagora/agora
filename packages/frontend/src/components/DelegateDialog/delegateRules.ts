import * as dateFns from "date-fns";
import { ethers } from "ethers";

import { RulesStruct } from "../../contracts/generated/Alligator";

import { WrappedRedelegationSetting } from "./CommitDelegation/RedelegationSelector";
import { WrappedTimePeriodSetting } from "./CommitDelegation/TimePeriodSelector";
import { WrappedVotingScopeSetting } from "./CommitDelegation/VotingScopeSelector";

export type DelegationRules = {
  redelegation: WrappedRedelegationSetting;
  votingScope: WrappedVotingScopeSetting;
  timePeriod: WrappedTimePeriodSetting;
};

export type DelegationContractState =
  | {
      type: "TOKEN";
    }
  | {
      type: "LIQUID";
      delegatedToLiquidContract: boolean;
      rules: { [K in keyof RulesStruct]: Awaited<RulesStruct[K]> } | null;
    };

export function delegateRulesToContractState(
  delegateRules: DelegationRules,
  needsDelegationToLiquidContract: boolean
): DelegationContractState {
  if (
    delegateRules.redelegation.kind === "CHOOSEN" &&
    delegateRules.redelegation.type === "NOT_ALLOWED" &&
    delegateRules.timePeriod.kind === "CHOOSEN" &&
    delegateRules.timePeriod.type === "INFINITE" &&
    delegateRules.votingScope.kind === "CHOOSEN" &&
    delegateRules.votingScope.type === "VOTE_ALL"
  ) {
    return {
      type: "TOKEN",
    };
  }

  return {
    type: "LIQUID",
    delegatedToLiquidContract: needsDelegationToLiquidContract,
    rules: {
      customRule: ethers.constants.AddressZero,
      permissions: (() => {
        if (delegateRules.votingScope.kind === "EXISTING") {
          return delegateRules.votingScope.value;
        }

        switch (delegateRules.votingScope.type) {
          case "VOTE_ALL":
            return PERMISSION_VOTE | PERMISSION_SIGN | PERMISSION_PROPOSE;

          case "VOTE_PROPHOUSE":
            return PERMISSION_SIGN;
        }
      })(),
      maxRedelegations: (() => {
        if (delegateRules.redelegation.kind === "EXISTING") {
          return delegateRules.redelegation.value;
        }

        switch (delegateRules.redelegation.type) {
          case "NOT_ALLOWED":
            return 0;
          case "ALLOWED_ONCE":
            return 1;
          case "ALLOWED_ALL":
            return maxUint8Value;
        }
      })(),
      blocksBeforeVoteCloses: 0,
      notValidBefore: 0,
      notValidAfter: (() => {
        const date = (() => {
          if (delegateRules.timePeriod.kind === "EXISTING") {
            return delegateRules.timePeriod.value;
          }

          const timePeriod = delegateRules.timePeriod.type;

          if (timePeriod === "INFINITE") {
            return null;
          }

          const monthsCount = (() => {
            switch (timePeriod) {
              case "TIME_PERIOD_1_MONTH":
                return 1;
              case "TIME_PERIOD_2_MONTH":
                return 2;
              case "TIME_PERIOD_6_MONTH":
                return 6;
              case "TIME_PERIOD_12_MONTH":
                return 12;
            }
          })();

          return dateFns.add(new Date(), {
            months: monthsCount,
          });
        })();

        if (!date) {
          return 0;
        }

        return Math.floor(date.valueOf() / 1000);
      })(),
    },
  };
}

export const PERMISSION_VOTE = 0b001;
export const PERMISSION_SIGN = 0b010;
export const PERMISSION_PROPOSE = 0b100;

const maxUint8Value = Math.pow(2, 8) - 1;

export function restrictiveRules(): RulesStruct {
  return {
    customRule: ethers.constants.AddressZero,
    permissions: 0,
    notValidAfter: 0,
    notValidBefore: 0,
    maxRedelegations: 0xff,
    blocksBeforeVoteCloses: 0,
  };
}

import { nounsToken, nounsAlligator } from "@agora/common";
import { Address } from "@wagmi/core";
import { useCallback } from "react";

import { useContractWriteFn } from "../../hooks/useContractWrite";

import { DelegationContractState, Rules } from "./delegateRules";
import { LiquidDelegationStepTargetDelegateFragment$key } from "./pages/CommitMultiStepDelegation/steps/__generated__/LiquidDelegationStepTargetDelegateFragment.graphql";

export type TokenDelegationAction = {
  type: "TOKEN_DELEGATION";
  targetAddress: Address;
};

export type LiquidDelegationAction = {
  type: "LIQUID_DELEGATION";
  targetAddress: Address;
  rules: Rules;
  fragment: LiquidDelegationStepTargetDelegateFragment$key;
};

export function useExecuteAction() {
  const writeLiquidDelegate = useContractWriteFn(nounsAlligator, "subDelegate");
  const writeTokenDelegation = useContractWriteFn(nounsToken, "delegate");

  return useCallback(
    (action: TokenDelegationAction | LiquidDelegationAction) => {
      switch (action.type) {
        case "TOKEN_DELEGATION":
          return writeTokenDelegation([action.targetAddress]);

        case "LIQUID_DELEGATION":
          return writeLiquidDelegate([
            action.targetAddress,
            action.rules,
            true,
          ]);
      }
    },
    []
  );
}

export type DelegationActions = {
  tokenDelegation?: TokenDelegationAction;
  liquidDelegation?: LiquidDelegationAction;
};

export function actionsForDelegationState(
  targetContractDelegationState: DelegationContractState,
  existingDelegationContractState: DelegationContractState,
  targetAddress: Address,
  liquidDelegationTargetAddressFragment: LiquidDelegationStepTargetDelegateFragment$key,
  liquidDelegationProxyAddress: Address
): DelegationActions {
  switch (targetContractDelegationState.type) {
    case "LIQUID": {
      return {
        liquidDelegation: (() => {
          if (targetContractDelegationState.rules) {
            return {
              type: "LIQUID_DELEGATION",
              targetAddress,
              rules: targetContractDelegationState.rules,
              fragment: liquidDelegationTargetAddressFragment,
            };
          }
        })(),

        tokenDelegation: (() => {
          if (
            (existingDelegationContractState.type === "TOKEN" ||
              (existingDelegationContractState.type === "LIQUID" &&
                !existingDelegationContractState.delegatedToLiquidContract)) &&
            targetContractDelegationState.delegatedToLiquidContract
          ) {
            return {
              type: "TOKEN_DELEGATION",
              targetAddress: liquidDelegationProxyAddress,
            };
          }
        })(),
      };
    }

    case "TOKEN": {
      return {
        tokenDelegation: {
          type: "TOKEN_DELEGATION",
          targetAddress,
        },
      };
    }
  }
}

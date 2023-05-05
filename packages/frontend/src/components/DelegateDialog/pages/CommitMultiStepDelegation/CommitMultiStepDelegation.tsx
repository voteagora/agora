import { useState } from "react";

import { LiquidDelegationAction, TokenDelegationAction } from "../../action";

import { TokenDelegationStep } from "./steps/TokenDelegationStep";
import { LiquidDelegationStep } from "./steps/LiquidDelegationStep";
import { ConfirmationStep } from "./steps/ConfirmationStep";

type Props = {
  tokenDelegation: TokenDelegationAction;
  liquidDelegation: LiquidDelegationAction;
  complete: () => void;
};

type CurrentStepState =
  | {
      type: "TOKEN_DELEGATION_STEP";
    }
  | {
      type: "LIQUID_DELEGATION_STEP";
    }
  | {
      type: "CONFIRMATION_STEP";
    };

export function CommitMultiStepDelegation({
  tokenDelegation,
  liquidDelegation,
  complete,
}: Props) {
  const [state, setState] = useState<CurrentStepState>({
    type: "TOKEN_DELEGATION_STEP",
  });

  switch (state.type) {
    case "TOKEN_DELEGATION_STEP": {
      return (
        <TokenDelegationStep
          completeStep={() =>
            setState({
              type: "LIQUID_DELEGATION_STEP",
            })
          }
          tokenDelegation={tokenDelegation}
        />
      );
    }

    case "LIQUID_DELEGATION_STEP": {
      return (
        <LiquidDelegationStep
          completeStep={() =>
            setState({
              type: "CONFIRMATION_STEP",
            })
          }
          liquidDelegation={liquidDelegation}
        />
      );
    }

    case "CONFIRMATION_STEP": {
      return <ConfirmationStep completeStep={() => complete()} />;
    }
  }
}

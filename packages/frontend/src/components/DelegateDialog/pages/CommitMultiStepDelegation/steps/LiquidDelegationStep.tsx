import { useState } from "react";
import { css } from "@emotion/css";
import { graphql, useFragment } from "react-relay";

import { LiquidDelegationAction, useExecuteAction } from "../../../action";
import { VStack } from "../../../../VStack";
import { DelegateButton } from "../../../DelegateButton";
import * as theme from "../../../../../theme";
import { NounResolvedName } from "../../../../NounResolvedName";
import { handlingError } from "../../../../../hooks/useContractWrite";

type Props = {
  completeStep: () => void;
  liquidDelegation: LiquidDelegationAction;
};

export function LiquidDelegationStep({
  liquidDelegation,
  completeStep,
}: Props) {
  const executeAction = useExecuteAction();
  const [isPending, setIsPending] = useState(false);

  const result = useFragment(
    graphql`
      fragment LiquidDelegationStepTargetDelegateFragment on Delegate {
        address {
          resolvedName {
            ...NounResolvedNameFragment
          }
        }
      }
    `,
    liquidDelegation.fragment
  );

  return (
    <VStack gap="4">
      <span
        className={css`
          font-size: ${theme.fontSize["2xl"]};
        `}
      >
        <span
          className={css`
            color: ${theme.colors.gray["700"]};
          `}
        >
          Step 2/2:{" "}
        </span>
        Liquid delegate your nouns
      </span>

      <span>
        Next, allow{" "}
        <NounResolvedName resolvedName={result.address.resolvedName} /> to
        perform actions through through your liquid delegation proxy.
      </span>

      <div
        className={css`
          height: ${theme.spacing["16"]};
        `}
      />

      {(() => {
        if (isPending) {
          return <DelegateButton>Loading...</DelegateButton>;
        }

        return (
          <DelegateButton
            onClick={() =>
              handlingError(
                (async () => {
                  setIsPending(true);
                  try {
                    await executeAction(liquidDelegation);
                    completeStep();
                  } finally {
                    setIsPending(false);
                  }
                })()
              )
            }
          >
            Liquid Delegate
          </DelegateButton>
        );
      })()}
    </VStack>
  );
}

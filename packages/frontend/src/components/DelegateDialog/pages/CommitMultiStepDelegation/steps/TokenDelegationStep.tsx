import { useState } from "react";
import { css } from "@emotion/css";

import { TokenDelegationAction, useExecuteAction } from "../../../action";
import { VStack } from "../../../../VStack";
import { DelegateButton } from "../../../DelegateButton";
import * as theme from "../../../../../theme";
import { useSetAutoCloseDialog } from "../../../../DialogProvider/DialogProvider";
import { handlingError } from "../../../../../hooks/useContractWrite";

type Props = {
  completeStep: () => void;
  tokenDelegation: TokenDelegationAction;
};

export function TokenDelegationStep({ completeStep, tokenDelegation }: Props) {
  const executeAction = useExecuteAction();
  const [isPending, setIsPending] = useState(false);
  const setAutoCloseDialog = useSetAutoCloseDialog();

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
          Step 1/2:{" "}
        </span>
        Delegate to proxy
      </span>

      <span
        className={css`
          font-size: ${theme.fontSize.base};
        `}
      >
        To liquid delegate, first delegate your nouns to your liquid delegation
        proxy.
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
                  setAutoCloseDialog(false);
                  setIsPending(true);
                  try {
                    await executeAction(tokenDelegation);
                    completeStep();
                  } finally {
                    setIsPending(false);
                  }
                })()
              )
            }
          >
            Delegate to Proxy
          </DelegateButton>
        );
      })()}
    </VStack>
  );
}

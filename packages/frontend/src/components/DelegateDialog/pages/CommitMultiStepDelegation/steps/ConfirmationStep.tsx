import { css } from "@emotion/css";

import { VStack } from "../../../../VStack";
import * as theme from "../../../../../theme";
import { DelegateButton } from "../../../DelegateButton";

type Props = {
  completeStep: () => void;
};

export function ConfirmationStep({ completeStep }: Props) {
  return (
    <VStack gap="4">
      <span
        className={css`
          font-size: ${theme.fontSize["2xl"]};
        `}
      >
        Your transactions have been submitted!
      </span>

      <span>
        If you're using a multisig, please make sure that your signers sign and
        execute both transactions
      </span>

      <div
        className={css`
          height: ${theme.spacing["16"]};
        `}
      />

      <DelegateButton onClick={completeStep}>Done</DelegateButton>
    </VStack>
  );
}

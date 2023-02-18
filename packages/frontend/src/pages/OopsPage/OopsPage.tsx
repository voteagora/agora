import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VStack, HStack } from "../../components/VStack";
import blink from "./blink.gif";

export function OopsPage() {
  return (
    <VStack
      justifyContent="center"
      className={css`
        height: 80vh;
        color: ${theme.colors.gray[700]};
      `}
    >
      <VStack alignItems="center">
        <img
          src={blink}
          alt={blink}
          className={css`
            width: 32px;
            margin-bottom: 8px;
          `}
        />
        Oops! Nothing's here
      </VStack>
    </VStack>
  );
}

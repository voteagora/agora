import { ReactNode } from "react";
import { css } from "@emotion/css";
import * as theme from "../theme";
import { VStack } from "./VStack";

type Props = {
  children: ReactNode;
};

export function PageContainer({ children }: Props) {
  return (
    <VStack
      alignItems="center"
      className={css`
        background-color:#FCFCFC;
        background-image: radial-gradient(
          rgba(0, 0, 0, 10%) 0.5px,
          transparent 0
        );
        background-size: 8px 8px;
        font-family: ${theme.fontFamily.sans};
        width: 100%;
      `}
    >
      {children}
    </VStack>
  );
}

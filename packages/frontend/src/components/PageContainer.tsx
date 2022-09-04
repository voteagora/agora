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
        font-family: ${theme.fontFamily.sans};
        width: 100%;
      `}
    >
      {children}
    </VStack>
  );
}

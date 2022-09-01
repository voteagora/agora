import { ReactNode } from "react";
import { css } from "@emotion/css";
import * as theme from "../theme";

type Props = {
  children: ReactNode;
};

export function PageContainer({ children }: Props) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: ${theme.fontFamily.sans};
        width: 100%;
      `}
    >
      {children}
    </div>
  );
}

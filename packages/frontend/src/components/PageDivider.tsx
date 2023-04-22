import { css } from "@emotion/css";

import * as theme from "../theme";

export function PageDivider() {
  return (
    <div
      className={css`
        background: ${theme.colors.gray["300"]};
        width: 100%;
        height: 1px;
        margin-top: -${theme.spacing["8"]};
        z-index: -1;
        @media (max-width: ${theme.maxWidth.lg}) {
          margin-top: -${theme.spacing["40"]};
          margin-bottom: ${theme.spacing["32"]};
        }
      `}
    />
  );
}

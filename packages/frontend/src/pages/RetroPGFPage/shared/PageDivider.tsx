import { css } from "@emotion/css";
import * as theme from "../../../theme";

export function PageDivider() {
  return (
    <div
      className={css`
        background: ${theme.colors.gray["300"]};
        width: 100%;
        height: 1px;
        margin-top: -${theme.spacing["8"]};
        z-index: -1;
      `}
    />
  );
}

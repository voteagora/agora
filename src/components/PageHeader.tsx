import { css } from "@emotion/css";
import * as theme from "../theme";
import logo from "../logo.svg";

export function PageHeader() {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: row;
        width: ${theme.maxWidth["6xl"]};
        margin: ${theme.spacing["8"]} auto;
        padding: 0 ${theme.spacing["4"]};
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: row;
          gap: ${theme.spacing["4"]};
        `}
      >
        <img alt="logo" src={logo} />

        <span
          className={css`
            font-size: ${theme.fontSize.sm};
            color: ${theme.colors.gray["700"]};
          `}
        >
          Nouns Agora
        </span>
      </div>
    </div>
  );
}

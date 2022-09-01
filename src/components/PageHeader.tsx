import { css } from "@emotion/css";
import * as theme from "../theme";
import logo from "../logo.svg";
import { Link } from "react-router-dom";

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
      <Link to="/">
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
      </Link>
    </div>
  );
}

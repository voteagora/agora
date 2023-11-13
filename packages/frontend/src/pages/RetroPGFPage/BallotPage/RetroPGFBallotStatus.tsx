import { css } from "@emotion/css";
import * as theme from "../../../theme";

export function RetroPGFBallotStatus() {
  return (
    <div
      className={css`
        height: 325px;
        width: 100%;
        background-color: ${theme.colors.gray["200"]};
      `}
    >
      <p>Ballot will go here</p>
    </div>
  );
}

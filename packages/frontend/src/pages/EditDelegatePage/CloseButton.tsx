import { css } from "@emotion/css";

import * as theme from "../../theme";
import { CloseIcon } from "../../components/CloseIcon";

type Props = {
  onClick: () => void;
};

export function CloseButton({ onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={css`
        border-radius: ${theme.borderRadius.md};
        cursor: pointer;
        color: ${theme.colors.gray["500"]};
        margin: ${theme.spacing["1"]};

        :hover {
          color: ${theme.colors.gray["600"]};
          background: ${theme.colors.gray["200"]};
        }
      `}
    >
      <CloseIcon
        className={css`
          width: ${theme.spacing["4"]};
          height: ${theme.spacing["4"]};
          margin: 0.8rem;
        `}
      />
    </div>
  );
}

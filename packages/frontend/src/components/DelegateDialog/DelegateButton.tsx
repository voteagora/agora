import { ReactNode } from "react";
import { css, cx } from "@emotion/css";

import * as theme from "../../theme";

type DelegateButtonProps = {
  onClick?: () => void;
  children: ReactNode;
};

export const DelegateButton = ({ children, onClick }: DelegateButtonProps) => {
  return (
    <div
      onClick={() => {
        if (!onClick) {
          return;
        }

        onClick();
      }}
      className={cx(
        css`
          text-align: center;
          border-radius: ${theme.spacing["2"]};
          border: 1px solid ${theme.colors.gray.eb};
          font-weight: ${theme.fontWeight.semibold};
          padding: ${theme.spacing["4"]} 0;
          cursor: pointer;

          ${!onClick &&
          css`
            background: ${theme.colors.gray.eb};
            color: ${theme.colors.gray["700"]};
            cursor: not-allowed;
          `}

          :hover {
            background: ${theme.colors.gray.eb};
          }
        `,
        "plausible-event-name=DelegateButton+Click"
      )}
    >
      {children}
    </div>
  );
};

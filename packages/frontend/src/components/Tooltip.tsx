import { css, cx } from "@emotion/css";
import * as theme from "../../src/theme";

type TooltipProps = {
  text: string;
  className?: string;
};

export function Tooltip({ text, className }: TooltipProps) {
  return (
    <div
      id="tooltip"
      className={cx(
        css`
          position: absolute;
          top: calc(100% + ${theme.spacing["1"]});
          right: -${theme.spacing["2"]};

          font-size: ${theme.fontSize.sm};
          white-space: nowrap;
          visibility: hidden;
          background: #66676b;
          border-radius: ${theme.spacing["1"]};
          color: white;

          padding: ${theme.spacing["1"]} ${theme.spacing["2"]};
        `,
        className
      )}
    >
      {text}
    </div>
  );
}

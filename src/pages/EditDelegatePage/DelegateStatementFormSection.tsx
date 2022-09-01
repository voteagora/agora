import { css } from "@emotion/css";
import * as theme from "../../theme";

export function DelegateStatementFormSection() {
  return (
    <div
      className={css`
        border-bottom-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray["300"]};
        padding: ${theme.spacing["8"]} ${theme.spacing["6"]};
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: row;
          align-items: baseline;
          justify-content: space-between;
          gap: ${theme.spacing["4"]};
        `}
      >
        <h3
          className={css`
            font-weight: bold;
          `}
        >
          Delegate statement
        </h3>

        <span
          className={css`
            font-size: ${theme.fontSize.xs};
            color: ${theme.colors.gray["600"]};
          `}
        >
          Tip: use markdown for formatting, links, and images
        </span>
      </div>

      <textarea
        className={css`
          background: ${theme.colors.gray["200"]};
          padding: ${theme.spacing["4"]};
          margin-top: ${theme.spacing["2"]};
          border-radius: ${theme.borderRadius.md};
          outline: none;
          width: 100%;
          min-height: ${theme.spacing["64"]};
          box-shadow: ${theme.boxShadow.inner};
        `}
        placeholder="I believe that..."
      />
    </div>
  );
}

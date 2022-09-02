import { css } from "@emotion/css";
import * as theme from "../../theme";
import { formSectionHeadingStyle } from "./PastProposalsFormSection";
import { formSectionContainerStyles } from "./TopIssuesFormSection";

export const tipTextStyle = css`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.gray["600"]};
`;

export function DelegateStatementFormSection() {
  return (
    <div className={formSectionContainerStyles}>
      <div
        className={css`
          display: flex;
          flex-direction: row;
          align-items: baseline;
          justify-content: space-between;
          gap: ${theme.spacing["4"]};
        `}
      >
        <h3 className={formSectionHeadingStyle}>Delegate statement</h3>

        <span className={tipTextStyle}>
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

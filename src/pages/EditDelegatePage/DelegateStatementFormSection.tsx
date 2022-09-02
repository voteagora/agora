import { css, cx } from "@emotion/css";
import * as theme from "../../theme";
import { formSectionHeadingStyle } from "./PastProposalsFormSection";
import { formSectionContainerStyles } from "./TopIssuesFormSection";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

export const tipTextStyle = css`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.gray["600"]};
`;

type DisplayMode = "write" | "preview";

const displayModeSelectorStyles = css`
  cursor: pointer;
  color: ${theme.colors.gray["600"]};
  padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
  border-radius: ${theme.borderRadius.default};

  :hover {
    background: ${theme.colors.gray["200"]};
  }
`;

const displayModeSelectorSelectedStyles = css`
  background: ${theme.colors.gray["400"]};

  :hover {
    background: ${theme.colors.gray["400"]};
  }
`;

export function DelegateStatementFormSection() {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("write");
  const [delegateStatement, setDelegateStatement] = useState("");

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        ${formSectionContainerStyles}
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
        <h3 className={formSectionHeadingStyle}>Delegate statement</h3>

        <div
          className={css`
            display: flex;
            flex-direction: row;
            gap: ${theme.spacing["2"]};
          `}
        >
          <div
            className={css`
              ${displayModeSelectorStyles}
              ${displayMode === "write" && displayModeSelectorSelectedStyles}
            `}
            onClick={() => setDisplayMode("write")}
          >
            Write
          </div>

          <div
            className={css`
              ${displayModeSelectorStyles}
              ${displayMode === "preview" && displayModeSelectorSelectedStyles}
            `}
            onClick={() => setDisplayMode("preview")}
          >
            Preview
          </div>
        </div>
      </div>

      {displayMode === "write" && (
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
          value={delegateStatement}
          onChange={(e) => setDelegateStatement(e.target.value)}
          placeholder="I believe that..."
        />
      )}

      {displayMode === "preview" && (
        <ReactMarkdown
          children={delegateStatement}
          remarkPlugins={[remarkBreaks]}
          // tailwind prose + max-width override disabled
          className={cx("prose", "max-w-none")}
        />
      )}
    </div>
  );
}

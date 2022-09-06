import { css } from "@emotion/css";
import * as theme from "../../theme";
import { formSectionHeadingStyle } from "./PastProposalsFormSection";
import { formSectionContainerStyles } from "./TopIssuesFormSection";
import { useState } from "react";
import { Form } from "./DelegateStatementForm";
import { Markdown } from "../../components/Markdown";
import { HStack, VStack } from "../../components/VStack";

export const tipTextStyle = css`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.gray["600"]};
`;

type DisplayMode = "write" | "preview";

const displayModeSelectorStyles = css`
  cursor: pointer;
  font-size:${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.gray["600"]};
  padding: ${theme.spacing["1"]} ${theme.spacing["3"]};
  border-radius:${theme.borderRadius.full};

  :hover {
    background: ${theme.colors.gray["100"]};
    color: ${theme.colors.gray["900"]};
  }
`;

const displayModeSelectorSelectedStyles = css`
  background: ${theme.colors.gray["200"]};
  color: ${theme.colors.gray["900"]};
  border-radius:${theme.borderRadius.full};

  :hover {
    background: ${theme.colors.gray["200"]};
  }
`;

type DelegateStatementFormSectionProps = {
  form: Form;
};

export function DelegateStatementFormSection({
  form,
}: DelegateStatementFormSectionProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("write");

  return (
    <VStack
      className={css`
        ${formSectionContainerStyles}
      `}
    >
      <HStack alignItems="baseline" justifyContent="space-between" gap="4">
        <h3 className={formSectionHeadingStyle}>Delegate statement</h3>

        <HStack gap="0">
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
        </HStack>
      </HStack>

      {displayMode === "write" && (
        <textarea
          className={css`
            background: ${theme.colors.gray["100"]};
            padding: ${theme.spacing["4"]};
            margin-top: ${theme.spacing["2"]};
            border-radius: ${theme.borderRadius.md};
            outline: none;
            width: 100%;
            min-height: ${theme.spacing["64"]};
            border-width: ${theme.spacing.px};
            border-color: ${theme.colors.gray["300"]};
          `}
          value={form.state.delegateStatement}
          onChange={(e) => form.onChange.delegateStatement(e.target.value)}
          placeholder="I believe that..."
        />
      )}

      {displayMode === "preview" && (
        <Markdown markdown={form.state.delegateStatement} />
      )}
    </VStack>
  );
}

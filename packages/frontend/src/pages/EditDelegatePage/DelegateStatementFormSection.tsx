import { css } from "@emotion/css";
import { useState } from "react";
import { Tab } from "@headlessui/react";

import * as theme from "../../theme";
import { Markdown } from "../../components/Markdown";
import { HStack, VStack } from "../../components/VStack";

import { formSectionHeadingStyle } from "./PastProposalsFormSection";
import { formSectionContainerStyles } from "./TopIssuesFormSection";
import { Form } from "./DelegateStatementForm";

export const tipTextStyle = css`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.gray["800"]};
`;

type DisplayMode = "write" | "preview";

const displayModeSelectorStyles = css`
  cursor: pointer;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.gray["600"]};
  padding: ${theme.spacing["1"]} ${theme.spacing["3"]};
  border-radius: ${theme.borderRadius.full};

  :hover {
    background: ${theme.colors.gray["100"]};
    color: ${theme.colors.gray["900"]};
  }
`;

const displayModeSelectorSelectedStyles = css`
  background: ${theme.colors.gray["200"]};
  color: ${theme.colors.gray["900"]};
  border-radius: ${theme.borderRadius.full};

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

        <Tab.Group
          manual
          selectedIndex={(() => {
            switch (displayMode) {
              case "preview":
                return 1;

              case "write":
                return 0;
            }
          })()}
          onChange={(index) => {
            switch (index) {
              case 0:
                setDisplayMode("write");
                return;

              case 1:
                setDisplayMode("preview");
                return;
            }
          }}
        >
          <Tab.List>
            <HStack gap="1">
              <Tab
                className={css`
                  outline: none;
                `}
              >
                {({ selected }) => (
                  <div
                    className={css`
                      ${displayModeSelectorStyles}
                      ${selected && displayModeSelectorSelectedStyles}
                    `}
                  >
                    Write
                  </div>
                )}
              </Tab>

              <Tab
                className={css`
                  outline: none;
                `}
              >
                {({ selected }) => (
                  <div
                    className={css`
                      ${displayModeSelectorStyles}
                      ${selected && displayModeSelectorSelectedStyles}
                    `}
                  >
                    Preview
                  </div>
                )}
              </Tab>
            </HStack>
          </Tab.List>
        </Tab.Group>
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

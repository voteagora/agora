import { useCallback } from "react";
import { css } from "@emotion/css";
import { Menu } from "@headlessui/react";

import { icons } from "../../icons/icons";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import {
  dropdownContainerStyles,
  dropdownItemActiveStyle,
  DropdownItems,
  dropdownItemStyle,
} from "../../components/DelegateDialog/DropDown";

import { formSectionHeadingStyle } from "./PastProposalsFormSection";
import { CloseButton } from "./CloseButton";
import { Form } from "./DelegateStatementForm";

type IssueTypeDefinition = {
  key: string;
  title: string;
  icon: keyof typeof icons;
};

export const issueDefinitions: IssueTypeDefinition[] = [
  {
    title: "Proliferation",
    key: "proliferation",
    icon: "speakerCone",
  },
  {
    title: "Treasury management",
    key: "treasury",
    icon: "piggyBank",
  },
  {
    title: "Builder funding",
    key: "funding",
    icon: "measure",
  },
];

export type IssueState = {
  type: string;
  value: string;
};

function initialIssueState(type: string): IssueState {
  return {
    type,
    value: "",
  };
}

export const formSectionContainerStyles = css`
  padding: ${theme.spacing["8"]} ${theme.spacing["6"]};
  border-bottom-width: ${theme.spacing.px};
  border-color: ${theme.colors.gray["300"]};
`;

export function initialTopIssues(): IssueState[] {
  return [initialIssueState("treasury"), initialIssueState("proliferation")];
}

type Props = {
  form: Form;
};

export function TopIssuesFormSection({ form }: Props) {
  const topIssues = form.state.topIssues;
  const setTopIssues = form.onChange.topIssues;

  const addIssue = useCallback(
    (selectionKey: string) => {
      setTopIssues((lastIssues) => {
        return [...lastIssues, initialIssueState(selectionKey)];
      });
    },
    [setTopIssues]
  );

  const removeIssue = useCallback(
    (index: number) => {
      setTopIssues((lastIssues) =>
        lastIssues.filter((needle, needleIndex) => needleIndex !== index)
      );
    },
    [setTopIssues]
  );

  const updateIssue = useCallback(
    (index: number, value: string) => {
      setTopIssues((lastIssues) =>
        lastIssues.map((issue, needleIdx) => {
          if (needleIdx === index) {
            return {
              ...issue,
              value,
            };
          }

          return issue;
        })
      );
    },
    [setTopIssues]
  );

  return (
    <div className={formSectionContainerStyles}>
      <HStack
        gap="4"
        justifyContent="space-between"
        alignItems="baseline"
        className={css`
          @media (max-width: ${theme.maxWidth.lg}) {
            flex-direction: column;
          }
        `}
      >
        <h3 className={formSectionHeadingStyle}>Views on top issues</h3>
        <Dropdown addIssue={addIssue} />
      </HStack>

      <VStack
        gap="4"
        className={css`
          margin-top: ${theme.spacing["6"]};
        `}
      >
        {topIssues.map((issue, index) => {
          const issueDef = issueDefinitions.find(
            (needle) => issue.type === needle.key
          )!;

          return (
            <HStack gap="4" alignItems="center" key={index}>
              <div
                className={css`
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  width: ${theme.spacing["12"]};
                  height: ${theme.spacing["12"]};
                  min-width: ${theme.spacing["12"]};
                  background-color: ${theme.colors.white};
                  border-radius: ${theme.borderRadius.md};
                  border-width: ${theme.spacing.px};
                  border-color: ${theme.colors.gray["300"]};
                  box-shadow: ${theme.boxShadow.newDefault};
                  padding: ${theme.spacing["2"]};
                `}
              >
                <img src={icons[issueDef.icon]} alt={issueDef.title} />
              </div>

              <VStack
                className={css`
                  flex: 1;
                  position: relative;
                `}
              >
                <VStack
                  className={css`
                    position: absolute;
                    right: 0;
                    top: 0;
                    bottom: 0;
                  `}
                >
                  <CloseButton onClick={() => removeIssue(index)} />
                </VStack>
                <input
                  className={css`
                    ${sharedInputStyle};
                    padding-right: ${theme.spacing["12"]};
                  `}
                  type="text"
                  placeholder={`On ${issueDef.title.toLowerCase()}, I believe...`}
                  value={issue.value}
                  onChange={(evt) => updateIssue(index, evt.target.value)}
                />
              </VStack>
            </HStack>
          );
        })}
      </VStack>
    </div>
  );
}

type DropdownProps = {
  addIssue: (key: string) => void;
};

function Dropdown({ addIssue }: DropdownProps) {
  return (
    <Menu as="div" className={dropdownContainerStyles}>
      {({ open }) => (
        <>
          <Menu.Button
            className={css`
              color: #66676b;
            `}
          >
            + Add a new issue
          </Menu.Button>
          <Menu.Items static>
            <DropdownItems open={open}>
              {issueDefinitions.map((def) => (
                <Menu.Item key={def.key}>
                  {({ active }) => (
                    <div
                      onClick={() => addIssue(def.key)}
                      className={css`
                        ${dropdownItemStyle};
                        ${active && dropdownItemActiveStyle}
                      `}
                    >
                      {def.title}
                    </div>
                  )}
                </Menu.Item>
              ))}
            </DropdownItems>
          </Menu.Items>
        </>
      )}
    </Menu>
  );
}

export const sharedInputStyle = css`
  background: ${theme.colors.gray["100"]};
  outline: none;
  padding: ${theme.spacing["3"]} ${theme.spacing["3"]};
  border-width: ${theme.spacing.px};
  border-color: ${theme.colors.gray["300"]};
  border-radius: ${theme.borderRadius.md};
`;

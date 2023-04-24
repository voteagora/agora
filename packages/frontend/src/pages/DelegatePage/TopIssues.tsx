import { useFragment, graphql } from "react-relay";
import { css } from "@emotion/css";

import { issueDefinitions } from "../EditDelegatePage/TopIssuesFormSection";
import { HStack, VStack } from "../../components/VStack";
import * as theme from "../../theme";
import { icons } from "../../icons/icons";

import { TopIssuesFragment$key } from "./__generated__/TopIssuesFragment.graphql";

export function TopIssues({ fragment }: { fragment: TopIssuesFragment$key }) {
  const { topIssues } = useFragment(
    graphql`
      fragment TopIssuesFragment on DelegateStatement {
        topIssues {
          type
          value
        }
      }
    `,
    fragment
  );

  if (!topIssues.length) {
    return null;
  }

  const topIssuesWithDefinition = topIssues.flatMap((topIssue) => {
    const issueDef = issueDefinitions.find(
      (issue) => issue.key === topIssue.type
    );

    if (!issueDef) {
      return [];
    }

    if (!topIssue.value) {
      return [];
    }

    return {
      issueDef,
      topIssue,
    };
  });

  if (!topIssuesWithDefinition.length) {
    return null;
  }

  return (
    <VStack gap="4">
      <h2
        className={css`
          font-size: ${theme.fontSize["2xl"]};
          font-weight: bold;
        `}
      >
        Top Issues
      </h2>

      <VStack gap="4">
        {topIssuesWithDefinition.map(({ topIssue, issueDef }, index) => (
          <div
            key={index}
            className={css`
              border-radius: ${theme.spacing["3"]};
              border: 1px solid #ebebeb;
              box-shadow: ${theme.boxShadow.newDefault};
              background: ${theme.colors.white};
              padding: ${theme.spacing["3"]};
              background-color: ${theme.colors.white};
            `}
          >
            <HStack gap="4" alignItems="flex-start">
              <VStack
                justifyContent="center"
                className={css`
                  flex-shrink: 0;
                `}
              >
                <VStack
                  className={css`
                    padding: ${theme.spacing["3"]};
                    border-radius: ${theme.spacing["2"]};
                    box-shadow: ${theme.boxShadow.newDefault};
                    border: 1px solid #ebebeb;
                  `}
                >
                  <img
                    src={icons[issueDef.icon]}
                    alt={issueDef.title}
                    className={css`
                      width: ${theme.spacing["6"]};
                      height: ${theme.spacing["6"]};
                    `}
                  />
                </VStack>
              </VStack>

              <VStack>
                <div
                  className={css`
                    font-size: ${theme.fontSize.xs};
                    font-weight: ${theme.fontWeight.medium};
                    color: #66676b;
                  `}
                >
                  {issueDef.title}
                </div>
                <div>{topIssue.value}</div>
              </VStack>
            </HStack>
          </div>
        ))}
      </VStack>
    </VStack>
  );
}

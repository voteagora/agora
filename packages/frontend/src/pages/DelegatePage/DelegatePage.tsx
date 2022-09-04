import { Navigate, useParams } from "react-router-dom";
import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { DelegatePageQuery } from "./__generated__/DelegatePageQuery.graphql";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { PageHeader } from "../../components/PageHeader";
import { VoterPanel } from "./VoterPanel";
import { PastVotes } from "./PastVotes";
import { PageContainer } from "../../components/PageContainer";
import { Markdown } from "../../components/Markdown";
import { HStack, VStack } from "../../components/VStack";
import { issueDefinitions } from "../EditDelegatePage/TopIssuesFormSection";
import { icons } from "../../icons/icons";

export function DelegatePage() {
  const { delegateId } = useParams();

  const query = useLazyLoadQuery<DelegatePageQuery>(
    graphql`
      query DelegatePageQuery($id: ID!) {
        ...VoterPanelQueryFragment

        address(address: $id) {
          wrappedDelegate {
            delegate {
              ...PastVotesFragment
            }

            statement {
              statement
              topIssues {
                type
                value
              }
            }
          }

          ...VoterPanelDelegateFragment
        }
      }
    `,
    {
      id: delegateId ?? "",
    }
  );

  const wrappedDelegate = query.address.wrappedDelegate;

  if (!wrappedDelegate.delegate && !wrappedDelegate.statement) {
    // todo: handle delegate not found
    return <Navigate to="/" />;
  }

  return (
    <PageContainer>
      <PageHeader />

      <HStack
        justifyContent="space-between"
        gap="16"
        className={css`
          margin: ${theme.spacing["16"]};
          margin-top: ${theme.spacing["8"]};
          width: 100%;
          max-width: ${theme.maxWidth["6xl"]};
        `}
      >
        <div
          className={css`
            width: ${theme.maxWidth.sm};
          `}
        >
          <VoterPanel delegateFragment={query.address} queryFragment={query} />
        </div>

        <VStack gap="8">
          {wrappedDelegate.statement?.statement && (
            <VStack gap="4">
              <h2
                className={css`
                  font-size: ${theme.fontSize["2xl"]};
                  font-weight: bold;
                `}
              >
                Delegate statement
              </h2>

              <Markdown markdown={wrappedDelegate.statement.statement} />
            </VStack>
          )}

          {wrappedDelegate.statement?.topIssues.length && (
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
                {wrappedDelegate.statement.topIssues.flatMap((topIssue) => {
                  const issueDef = issueDefinitions.find(
                    (issue) => issue.key === topIssue.type
                  );

                  if (!issueDef) {
                    return [];
                  }

                  return (
                    <div
                      className={css`
                        border-radius: ${theme.spacing["3"]};
                        border: 1px solid #ebebeb;
                        box-shadow: ${theme.boxShadow.newDefault};
                        padding: ${theme.spacing["3"]};
                      `}
                    >
                      <HStack gap="4">
                        <VStack justifyContent="center">
                          <img
                            src={icons[issueDef.icon]}
                            className={css`
                              padding: ${theme.spacing["3"]};
                              border-radius: ${theme.spacing["2"]};
                              box-shadow: ${theme.boxShadow.newDefault};
                              border: 1px solid #ebebeb;
                            `}
                          />
                        </VStack>

                        <VStack>
                          <div
                            className={css`
                              font-size: ${theme.fontSize.xs};
                              color: #66676b;
                            `}
                          >
                            {issueDef.title}
                          </div>
                          <div>{topIssue.value}</div>
                        </VStack>
                      </HStack>
                    </div>
                  );
                })}
              </VStack>
            </VStack>
          )}

          {wrappedDelegate.delegate && (
            <PastVotes fragment={wrappedDelegate.delegate} />
          )}
        </VStack>
      </HStack>
    </PageContainer>
  );
}

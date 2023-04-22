import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { DelegatePageQuery } from "./__generated__/DelegatePageQuery.graphql";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { PastVotes } from "./PastVotes";
import { Markdown } from "../../components/Markdown";
import { HStack, VStack } from "../../components/VStack";
import { ImpactfulProposals } from "./ImpactfulProposals";
import { useParams } from "../../components/HammockRouter/HammockRouter";
import { TopIssues } from "./TopIssues";
import { VoterPanel } from "../../components/VoterPanel/VoterPanel";

export function DelegatePage() {
  const { delegateId } = useParams();

  const query = useLazyLoadQuery<DelegatePageQuery>(
    graphql`
      query DelegatePageQuery($addressOrEnsName: String!) {
        delegate(addressOrEnsName: $addressOrEnsName) {
          ...VoterPanelFragment
          ...PastVotesFragment

          statement {
            statement

            ...ImpactfulProposalsFragment
            ...TopIssuesFragment
          }
        }
      }
    `,
    {
      addressOrEnsName: delegateId ?? "",
    }
  );

  return (
    <>
      <HStack
        gap="16"
        justifyContent="space-between"
        alignItems="flex-start"
        className={css`
          margin: ${theme.spacing["20"]};
          margin-top: ${theme.spacing["0"]};
          padding-left: ${theme.spacing["4"]};
          padding-right: ${theme.spacing["4"]};
          width: 100%;
          max-width: ${theme.maxWidth["6xl"]};

          @media (max-width: ${theme.maxWidth["6xl"]}) {
            flex-direction: column;
            align-items: center;
          }
        `}
      >
        <VStack
          className={css`
            position: sticky;
            top: ${theme.spacing["16"]};
            flex-shrink: 0;
            width: ${theme.maxWidth.xs};

            @media (max-width: ${theme.maxWidth["6xl"]}) {
              position: static;
            }

            @media (max-width: ${theme.maxWidth.lg}) {
              width: 100%;
            }
          `}
        >
          <VoterPanel fragment={query.delegate} />

          {!query.delegate.statement && (
            <div
              className={css`
                color: #66676b;
                line-height: ${theme.lineHeight.normal};
                font-size: ${theme.fontSize.xs};
                padding: ${theme.spacing["2"]};
              `}
            >
              This voter has not submitted a statement. Is this you? Connect
              your wallet to verify your address, and tell your community what
              you’d like to see.
            </div>
          )}
        </VStack>

        <VStack
          gap="8"
          className={css`
            min-width: 0;
            flex: 1;
          `}
        >
          {!!query.delegate.statement && (
            <>
              {query.delegate.statement.statement && (
                <VStack gap="4">
                  <h2
                    className={css`
                      font-size: ${theme.fontSize["2xl"]};
                      font-weight: bold;
                    `}
                  >
                    Delegate statement
                  </h2>

                  <Markdown markdown={query.delegate.statement.statement} />
                </VStack>
              )}

              <TopIssues fragment={query.delegate.statement} />
              <ImpactfulProposals fragment={query.delegate.statement} />
            </>
          )}

          <PastVotes fragment={query.delegate} />
        </VStack>
      </HStack>
    </>
  );
}

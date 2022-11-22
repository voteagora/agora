import { usePreloadedQuery } from "react-relay/hooks";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { PastVotes } from "./PastVotes";
import { HStack, VStack } from "../../components/VStack";
import { ImpactfulProposals } from "./ImpactfulProposals";
import { RouteProps } from "../../components/HammockRouter/HammockRouter";
import { TopIssues } from "./TopIssues";
import { Navigate } from "../../components/HammockRouter/Navigate";
import { VoterPanel } from "../../components/VoterPanel/VoterPanel";
import { StatementSection } from "./StatementSection";
import { query } from "./DelegatePageRoute";
import { DelegatePageRouteQuery } from "./__generated__/DelegatePageRouteQuery.graphql";

export function DelegatePage({
  initialQueryRef,
}: RouteProps<DelegatePageRouteQuery>) {
  const { delegate } = usePreloadedQuery<DelegatePageRouteQuery>(
    query,
    initialQueryRef
  );

  if (!delegate) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <HStack
        gap="16"
        justifyContent="space-between"
        alignItems="flex-start"
        className={css`
          margin: ${theme.spacing["16"]};
          margin-top: ${theme.spacing["8"]};
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
          <VoterPanel fragment={delegate} />

          {!delegate.statement && (
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
          {!!delegate?.statement && (
            <>
              <StatementSection fragment={delegate.statement} />

              <TopIssues fragment={delegate.statement} />
              <ImpactfulProposals fragment={delegate.statement} />
            </>
          )}

          <PastVotes fragment={delegate} />
        </VStack>
      </HStack>
    </>
  );
}

export default DelegatePage;

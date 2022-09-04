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

export function DelegatePage() {
  const { delegateId } = useParams();

  const query = useLazyLoadQuery<DelegatePageQuery>(
    graphql`
      query DelegatePageQuery($id: ID!) {
        ...VoterPanelQueryFragment

        delegate(id: $id) {
          ...VoterPanelDelegateFragment
          ...PastVotesFragment
        }
      }
    `,
    {
      id: delegateId ?? "",
    }
  );

  if (!query.delegate) {
    // todo: handle delegate not found
    return <Navigate to="/" />;
  }

  return (
    <PageContainer>
      <PageHeader />

      <div
        className={css`
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          gap: ${theme.spacing["16"]};
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
          <VoterPanel delegateFragment={query.delegate} queryFragment={query} />
        </div>

        <PastVotes fragment={query.delegate} />
      </div>
    </PageContainer>
  );
}

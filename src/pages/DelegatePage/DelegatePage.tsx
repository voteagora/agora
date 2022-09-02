import { useParams } from "react-router-dom";
import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { DelegatePageQuery } from "./__generated__/DelegatePageQuery.graphql";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { PageHeader } from "../../components/PageHeader";
import { VoterPanel } from "./VoterPanel";
import { PastVotes } from "./PastVotes";
import { usePrimaryAccount } from "../../components/EthersProviderProvider";
import { PageContainer } from "../../components/PageContainer";

export function DelegatePage() {
  const { delegateId } = useParams();
  const address = usePrimaryAccount();

  const query = useLazyLoadQuery<DelegatePageQuery>(
    graphql`
      query DelegatePageQuery($id: ID!, $address: ID!) {
        ...VoterPanelQueryFragment

        delegate(id: $id) {
          ...VoterPanelDelegateFragment
          ...PastVotesFragment
        }

        account(id: $address) {
          ...PageHeaderFragment
        }
      }
    `,
    {
      id: delegateId ?? "",
      address,
    }
  );

  if (!query.delegate) {
    return null;
  }

  return (
    <PageContainer>
      <PageHeader accountFragment={query.account} />

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

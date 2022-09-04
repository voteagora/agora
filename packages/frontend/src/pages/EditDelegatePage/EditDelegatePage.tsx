import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import { EditDelegatePageQuery } from "./__generated__/EditDelegatePageQuery.graphql";
import { PageHeader } from "../../components/PageHeader";
import * as theme from "../../theme";
import {
  EmptyVoterPanel,
  LoadingVoterPanel,
  VoterPanel,
} from "../DelegatePage/VoterPanel";
import { PageContainer } from "../../components/PageContainer";
import { DelegateStatementForm } from "./DelegateStatementForm";
import { Suspense } from "react";
import { EditDelegatePageLazyVoterPanelQuery } from "./__generated__/EditDelegatePageLazyVoterPanelQuery.graphql";
import { useAccount } from "wagmi";
import { Navigate } from "react-router-dom";

export function EditDelegatePage() {
  const query = useLazyLoadQuery<EditDelegatePageQuery>(
    graphql`
      query EditDelegatePageQuery {
        ...PastProposalsFormSectionProposalListFragment
      }
    `,
    {}
  );

  const { address } = useAccount();

  if (!address) {
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
        <DelegateStatementForm queryFragment={query} />

        <div
          className={css`
            width: ${theme.maxWidth.sm};
          `}
        >
          <Suspense fallback={<LoadingVoterPanel />}>
            <LazyVoterPanel address={address} />
          </Suspense>
        </div>
      </div>
    </PageContainer>
  );
}

export const buttonStyles = css`
  border-radius: ${theme.borderRadius.default};
  border-width: ${theme.spacing.px};
  border-color: ${theme.colors.gray["300"]};
  cursor: pointer;
  padding: ${theme.spacing["2"]} ${theme.spacing["4"]};

  :hover {
    background: ${theme.colors.gray["200"]};
  }
`;

type LazyVoterPanelProps = {
  address: string;
};

function LazyVoterPanel({ address }: LazyVoterPanelProps) {
  const query = useLazyLoadQuery<EditDelegatePageLazyVoterPanelQuery>(
    graphql`
      query EditDelegatePageLazyVoterPanelQuery($address: ID!) {
        address(address: $address) {
          resolvedName {
            ...NounResolvedLinkFragment
          }

          account {
            delegate {
              ...VoterPanelDelegateFragment
            }
          }
        }

        ...VoterPanelQueryFragment
      }
    `,
    {
      address,
    }
  );

  return query.address?.account?.delegate ? (
    <VoterPanel
      delegateFragment={query.address?.account?.delegate}
      queryFragment={query}
    />
  ) : (
    <EmptyVoterPanel resolvedName={query.address.resolvedName} />
  );
}

import { usePrimaryAccount } from "../../components/EthersProviderProvider";
import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import { EditDelegatePageQuery } from "./__generated__/EditDelegatePageQuery.graphql";
import { PageHeader } from "../../components/PageHeader";
import * as theme from "../../theme";
import { EmptyVoterPanel, VoterPanel } from "../DelegatePage/VoterPanel";
import { PageContainer } from "../../components/PageContainer";
import { DelegateStatementForm } from "./DelegateStatementForm";

export function EditDelegatePage() {
  const address = usePrimaryAccount();

  const query = useLazyLoadQuery<EditDelegatePageQuery>(
    graphql`
      query EditDelegatePageQuery($address: ID!) {
        address(address: $address) {
          ...PageHeaderFragment

          resolvedName {
            ...NounResolvedLinkFragment
          }
        }

        delegate(id: $address) {
          ...VoterPanelDelegateFragment
        }

        ...PastProposalsFormSectionProposalListFragment
        ...VoterPanelQueryFragment
      }
    `,
    {
      address,
    }
  );

  return (
    <PageContainer>
      <PageHeader accountFragment={query.address} />

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
          {query.delegate ? (
            <VoterPanel
              delegateFragment={query.delegate}
              queryFragment={query}
            />
          ) : (
            <EmptyVoterPanel resolvedName={query.address.resolvedName} />
          )}
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

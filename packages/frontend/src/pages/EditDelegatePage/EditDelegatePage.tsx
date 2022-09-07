import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import { EditDelegatePageQuery } from "./__generated__/EditDelegatePageQuery.graphql";
import * as theme from "../../theme";
import { LoadingVoterPanel, VoterPanel } from "../DelegatePage/VoterPanel";
import { DelegateStatementForm } from "./DelegateStatementForm";
import { Suspense } from "react";
import { EditDelegatePageLazyVoterPanelQuery } from "./__generated__/EditDelegatePageLazyVoterPanelQuery.graphql";
import { useAccount } from "wagmi";
import { HStack } from "../../components/VStack";
import { Navigate } from "../../components/HammockRouter/HammockRouter";

export function EditDelegatePage() {
  const { address } = useAccount();

  const query = useLazyLoadQuery<EditDelegatePageQuery>(
    graphql`
      query EditDelegatePageQuery($address: ID!) {
        ...DelegateStatementFormFragment @arguments(address: $address)
      }
    `,
    { address: address ?? "" }
  );

  if (!address) {
    return <Navigate to="/" />;
  }

  return (
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
    </HStack>
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

          ...VoterPanelDelegateFragment
        }

        ...VoterPanelQueryFragment
      }
    `,
    {
      address,
    }
  );

  return <VoterPanel delegateFragment={query.address} queryFragment={query} />;
}

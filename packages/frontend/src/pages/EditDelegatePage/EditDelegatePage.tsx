import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import { EditDelegatePageQuery } from "./__generated__/EditDelegatePageQuery.graphql";
import * as theme from "../../theme";
import { VoterPanel } from "../DelegatePage/VoterPanel";
import { DelegateStatementForm } from "./DelegateStatementForm";
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
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};
        margin-top: ${theme.spacing["8"]};
        width: 100%;
        max-width: ${theme.maxWidth["6xl"]};

        @media (max-width: ${theme.maxWidth["6xl"]}) {
          flex-direction: column-reverse;
          align-items: center;
        }
      `}
    >
      <DelegateStatementForm
        queryFragment={query}
        className={css`
          flex: 1;
        `}
      />

      <div
        className={css`
          flex-shrink: 0;
          width: ${theme.maxWidth.xs};
        `}
      >
        <LazyVoterPanel address={address} />
      </div>
    </HStack>
  );
}

export const buttonStyles = css`
  border-radius: ${theme.spacing["1"]};
  border-width: ${theme.spacing.px};
  border-color: ${theme.colors.gray.eb};
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

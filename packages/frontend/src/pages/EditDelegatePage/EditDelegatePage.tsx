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
import { Navigate } from "../../components/HammockRouter/Navigate";

export function EditDelegatePage() {
  const { address } = useAccount();

  const query = useLazyLoadQuery<EditDelegatePageQuery>(
    graphql`
      query EditDelegatePageQuery($address: String!) {
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
        margin-bottom: ${theme.spacing["8"]};
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
  border-radius: ${theme.spacing["2"]};
  border-width: ${theme.spacing.px};
  border-color: ${theme.colors.gray.eb};
  font-weight: ${theme.fontWeight.medium};
  box-shadow: ${theme.boxShadow.newDefault};
  cursor: pointer;
  padding: ${theme.spacing["3"]} ${theme.spacing["4"]};
  transition: all 200ms;

  :hover {
    background: ${theme.colors.gray["100"]};
  }

  :active {
    box-shadow: ${theme.boxShadow.none};
  }

  :disabled {
    background: ${theme.colors.gray.eb};
    color: ${theme.colors.gray["700"]};
  }
`;

type LazyVoterPanelProps = {
  address: string;
};

function LazyVoterPanel({ address }: LazyVoterPanelProps) {
  const query = useLazyLoadQuery<EditDelegatePageLazyVoterPanelQuery>(
    graphql`
      query EditDelegatePageLazyVoterPanelQuery($address: String!) {
        address(addressOrEnsName: $address) {
          ...VoterPanelDelegateFragment
        }

        ...VoterPanelQueryFragment
      }
    `,
    {
      address,
    }
  );

  if (!query.address) {
    return <Navigate to="/" />;
  }

  return <VoterPanel delegateFragment={query.address} queryFragment={query} />;
}

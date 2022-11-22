import * as theme from "../../theme";
import { usePreloadedQuery } from "react-relay/hooks";
import { css } from "@emotion/css";
import { DelegateStatementForm } from "./DelegateStatementForm";
import { HStack } from "../../components/VStack";
import { VoterPanel } from "../../components/VoterPanel/VoterPanel";
import { RouteProps } from "../../components/HammockRouter/HammockRouter";
import { editDelegateQuery } from "./EditDelegatePageRoute";
import { EditDelegatePageRouteQuery } from "./__generated__/EditDelegatePageRouteQuery.graphql";

export default EditDelegatePage;

export function EditDelegatePage({
  initialQueryRef,
}: RouteProps<EditDelegatePageRouteQuery>) {
  const query = usePreloadedQuery<EditDelegatePageRouteQuery>(
    editDelegateQuery,
    initialQueryRef
  );

  if (!query.delegate) {
    return null;
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

        @media (max-width: ${theme.maxWidth["4xl"]}) {
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

          @media (max-width: ${theme.maxWidth.lg}) {
            width: 100%;
          }
        `}
      >
        <VoterPanel fragment={query.delegate} />
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

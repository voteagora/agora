import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { HStack } from "../VStack";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { icons } from "../../icons/icons";
import toast from "react-hot-toast";
import { useStartTransition } from "../HammockRouter/HammockRouter";
import { buttonStyles } from "../../pages/EditDelegatePage/EditDelegatePage";
import { VoterPanelActionsFragment$key } from "./__generated__/VoterPanelActionsFragment.graphql";
import { VoterPanelActionsDelegateButtonFragment$key } from "./__generated__/VoterPanelActionsDelegateButtonFragment.graphql";
import { useOpenDialog } from "../DialogProvider/DialogProvider";

export function VoterPanelActions({
  className,
  fragment,
}: {
  className?: string;
  fragment: VoterPanelActionsFragment$key;
}) {
  const delegate = useFragment(
    graphql`
      fragment VoterPanelActionsFragment on Delegate {
        statement {
          twitter
          discord
        }

        ...VoterPanelActionsDelegateButtonFragment
      }
    `,
    fragment
  );

  const statement = delegate.statement;

  return (
    <HStack
      justifyContent="space-between"
      alignItems="stretch"
      className={className}
    >
      {statement && (
        <HStack gap="4" alignItems="center">
          {statement.twitter && (
            <a
              className={css`
                padding: ${theme.spacing["1"]};
              `}
              href={`https://twitter.com/${statement.twitter}`}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={icons.twitter} alt="twitter" />
            </a>
          )}

          {statement.discord && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast("copied discord handle to clipboard");

                navigator.clipboard.writeText(statement.discord);
              }}
            >
              <img src={icons.discord} alt="discord" />
            </button>
          )}
        </HStack>
      )}

      <DelegateButton
        fragment={delegate}
        full={!statement || (!statement.twitter && !statement.discord)}
      />
    </HStack>
  );
}

function DelegateButton({
  fragment,
  full,
}: {
  fragment: VoterPanelActionsDelegateButtonFragment$key;
  full: boolean;
}) {
  const delegate = useFragment(
    graphql`
      fragment VoterPanelActionsDelegateButtonFragment on Delegate {
        address {
          resolvedName {
            address
          }
        }
      }
    `,
    fragment
  );

  const startTransition = useStartTransition();
  const openDialog = useOpenDialog();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        startTransition(() =>
          openDialog({
            type: "DELEGATE",
            params: { target: delegate.address.resolvedName.address },
          })
        );
      }}
      className={css`
        ${buttonStyles};
        ${full &&
        css`
          width: 100%;
        `}
      `}
    >
      Delegate
    </button>
  );
}

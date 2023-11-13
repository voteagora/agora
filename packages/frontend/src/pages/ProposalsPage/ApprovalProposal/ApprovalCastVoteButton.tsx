import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { startTransition } from "react";
import { useOpenDialog } from "../../../components/DialogProvider/DialogProvider";
import { ApprovalCastVoteDialogFragment$key } from "./__generated__/ApprovalCastVoteDialogFragment.graphql";
import { useFragment } from "react-relay";
import { ApprovalCastVoteButtonFragment$key } from "./__generated__/ApprovalCastVoteButtonFragment.graphql";
import graphql from "babel-plugin-relay/macro";
import { ApprovalCastVoteButtonDelegateFragment$key } from "./__generated__/ApprovalCastVoteButtonDelegateFragment.graphql";
import { TokenAmountDisplayFragment$key } from "../../../components/__generated__/TokenAmountDisplayFragment.graphql";
import ConnectWalletButton from "../../../components/ConnectWalletButton";

type Props = {
  castVoteFragmentRef: ApprovalCastVoteDialogFragment$key;
  buttonFragmentRef: ApprovalCastVoteButtonFragment$key;
  delegateFragmentRef: ApprovalCastVoteButtonDelegateFragment$key;
};

export function ApprovalCastVoteButton({
  castVoteFragmentRef,
  buttonFragmentRef,
  delegateFragmentRef,
}: Props) {
  const result = useFragment(
    graphql`
      fragment ApprovalCastVoteButtonFragment on Proposal {
        id
        number
        status
      }
    `,
    buttonFragmentRef
  );

  const { delegate } = useFragment(
    graphql`
      fragment ApprovalCastVoteButtonDelegateFragment on Query
      @argumentDefinitions(
        address: { type: "String!" }
        skipAddress: { type: "Boolean!" }
      ) {
        delegate(addressOrEnsName: $address) @skip(if: $skipAddress) {
          statement {
            __typename
          }
          votes {
            proposal {
              id
            }
          }
          tokensRepresentedSnapshot(proposalId: $proposalId) {
            amount {
              ...TokenAmountDisplayFragment
            }
          }
        }
      }
    `,
    delegateFragmentRef
  );

  if (!delegate) {
    return <ConnectWalletButton />;
  }

  if (result.status !== "ACTIVE") {
    return <DisabledVoteButton reason="Not open to voting" />;
  }

  const hasVoted = !!delegate.votes.find((it) => it.proposal.id === result.id);
  if (hasVoted) {
    return <DisabledVoteButton reason="Already voted" />;
  }

  return (
    <CastVoteButton
      castVoteFragmentRef={castVoteFragmentRef}
      proposalId={result.number}
      hasStatement={!!delegate.statement}
      votesRepresentedRef={delegate.tokensRepresentedSnapshot.amount}
    />
  );
}

function CastVoteButton({
  castVoteFragmentRef,
  proposalId,
  hasStatement,
  votesRepresentedRef,
}: {
  castVoteFragmentRef: ApprovalCastVoteDialogFragment$key;
  proposalId: string;
  hasStatement: boolean;
  votesRepresentedRef: TokenAmountDisplayFragment$key;
}) {
  const openDialog = useOpenDialog();

  return (
    <div
      className={buttonStyle}
      onClick={(e) => {
        startTransition(() =>
          openDialog({
            type: "APPROVAL_CAST_VOTE",
            params: {
              castVoteFragmentRef,
              proposalId,
              hasStatement,
              votesRepresentedRef,
            },
          })
        );
      }}
    >
      Cast vote
    </div>
  );
}

function DisabledVoteButton({ reason }: { reason: string }) {
  return (
    <button disabled className={buttonStyle}>
      {reason}
    </button>
  );
}

export const buttonStyle = css`
  text-align: center;
  width: 100%;
  border-radius: ${theme.spacing["2"]};
  border: 1px solid ${theme.colors.gray.eo};
  font-weight: ${theme.fontWeight.semibold};
  cursor: pointer;
  padding-top: ${theme.spacing["3"]};
  padding-bottom: ${theme.spacing["3"]};
  font-size: ${theme.fontSize.base};
  background-color: ${theme.colors.white};
`;

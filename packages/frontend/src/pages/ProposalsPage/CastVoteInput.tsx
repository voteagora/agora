import { css, cx } from "@emotion/css";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import {
  colorForSupportType,
  SupportTextProps,
} from "../DelegatePage/VoteDetailsContainer";
import { buttonStyles } from "../EditDelegatePage/EditDelegatePage";
import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay/hooks";
import { CastVoteInputVoteButtonsFragment$key } from "./__generated__/CastVoteInputVoteButtonsFragment.graphql";

type Props = {
  onVoteClick: (
    supportType: SupportTextProps["supportType"],
    reason: string
  ) => void;
  className: string;
  framgnetRef: CastVoteInputVoteButtonsFragment$key;
};

export function CastVoteInput({ onVoteClick, className, framgnetRef }: Props) {
  const [reason, setReason] = useState<string>("");

  return (
    <VStack
      className={cx(
        css`
          border: 1px solid #e0e0e0;
          border-radius: ${theme.borderRadius.lg};
        `,
        className
      )}
    >
      <textarea
        className={css`
          padding: ${theme.spacing["4"]};
          resize: none;
          border-radius: ${theme.borderRadius.lg};
          :focus {
            outline: 0px;
          }
        `}
        placeholder="I believe..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <VStack
        justifyContent="stretch"
        alignItems="stretch"
        className={css`
          padding-top: ${theme.spacing["1"]};
          padding-bottom: ${theme.spacing["3"]};
          padding-left: ${theme.spacing["3"]};
          padding-right: ${theme.spacing["3"]};
        `}
      >
        <VoteButtons
          onClick={(supportType) => onVoteClick(supportType, reason)}
          fragmentRef={framgnetRef}
        />
      </VStack>
    </VStack>
  );
}

function VoteButtons({
  onClick,
  fragmentRef,
}: {
  onClick: (nextSupportType: SupportTextProps["supportType"]) => void;
  fragmentRef: CastVoteInputVoteButtonsFragment$key;
}) {
  const { address: accountAddress } = useAccount();

  const result = useFragment(
    graphql`
      fragment CastVoteInputVoteButtonsFragment on Proposal {
        status

        votes {
          voter {
            address {
              resolvedName {
                address
              }
            }
          }
        }
      }
    `,
    fragmentRef
  );

  const hasVoted = useMemo(
    () =>
      accountAddress &&
      !!result.votes.find(
        (vote) =>
          vote.voter.address.resolvedName.address.toLowerCase() ===
          accountAddress.toLowerCase()
      ),
    [result.votes, accountAddress]
  );

  if (result.status !== "ACTIVE") {
    return <DisabledVoteButton reason="Not open to voting" />;
  }

  if (!accountAddress) {
    return <DisabledVoteButton reason="Connect wallet to vote" />;
  }

  if (hasVoted) {
    return <DisabledVoteButton reason="Already voted" />;
  }

  return (
    <HStack gap="2">
      {(["FOR", "AGAINST", "ABSTAIN"] as SupportTextProps["supportType"][]).map(
        (supportType) => (
          <VoteButton
            key={supportType}
            action={supportType}
            onClick={() => {
              onClick(supportType);
            }}
          />
        )
      )}
    </HStack>
  );
}

function VoteButton({
  action,
  onClick,
}: {
  action: SupportTextProps["supportType"];
  onClick: () => void;
}) {
  return (
    <button
      className={css`
        ${voteButtonStyles};
        color: ${colorForSupportType(action)};
        flex: 1;
      `}
      onClick={onClick}
    >
      {action.toLowerCase()}
    </button>
  );
}

const voteButtonStyles = css`
  ${buttonStyles};
  height: ${theme.spacing["8"]};
  text-transform: capitalize;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: ${theme.borderRadius.md};
`;

function DisabledVoteButton({ reason }: { reason: string }) {
  return (
    <button
      disabled
      className={css`
        ${voteButtonStyles};
        box-shadow: none;
        width: 100%;
      `}
    >
      {reason}
    </button>
  );
}

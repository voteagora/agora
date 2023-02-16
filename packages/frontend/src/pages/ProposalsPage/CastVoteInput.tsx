import { css, cx } from "@emotion/css";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import {
  colorForSupportType,
  SupportTextProps,
} from "../DelegatePage/VoteDetailsContainer";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { useAccount } from "wagmi";
import { buttonStyles } from "../EditDelegatePage/EditDelegatePage";
import { useState } from "react";
import { CastVoteInputFragment$key } from "./__generated__/CastVoteInputFragment.graphql";
import { CastVoteInputVoteButtonsFragment$key } from "./__generated__/CastVoteInputVoteButtonsFragment.graphql";
import { useLazyLoadQuery } from "react-relay/hooks";
import { CastVoteInputQuery } from "./__generated__/CastVoteInputQuery.graphql";

type Props = {
  fragmentRef: CastVoteInputFragment$key;
  onVoteClick: (
    supportType: SupportTextProps["supportType"],
    reason: string
  ) => void;
  className: string;
};

export function CastVoteInput({ fragmentRef, onVoteClick, className }: Props) {
  const [reason, setReason] = useState<string>("");
  const result = useFragment(
    graphql`
      fragment CastVoteInputFragment on Proposal
      @argumentDefinitions(address: { type: "String!" }) {
        ...CastVoteInputVoteButtonsFragment @arguments(address: $address)
      }
    `,
    fragmentRef
  );

  return (
    <VStack
      className={cx(
        css`
          border: 1px solid #e0e0e0;
          border-radius: ${theme.borderRadius.lg};
          @media (max-width: ${theme.maxWidth["2xl"]}) {
            display: none;
          }
        `,
        className
      )}
    >
      <textarea
        className={css`
          padding: ${theme.spacing["4"]};
          resize: none;
          ::-webkit-scrollbar {
            display: none;
          }
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
          fragmentRef={result}
          onClick={(supportType) => onVoteClick(supportType, reason)}
        />
      </VStack>
    </VStack>
  );
}

function VoteButtons({
  fragmentRef,
  onClick,
}: {
  fragmentRef: CastVoteInputVoteButtonsFragment$key;
  onClick: (nextSupportType: SupportTextProps["supportType"]) => void;
}) {
  // todo: check if voting open
  // todo: check if already voted
  // todo: we want to check this from the chain not from the subgraph
  const { address: accountAddress } = useAccount();

  const { address } = useLazyLoadQuery<CastVoteInputQuery>(
    graphql`
      query CastVoteInputQuery($accountAddress: String!, $skip: Boolean!) {
        address(addressOrEnsName: $accountAddress) @skip(if: $skip) {
          wrappedDelegate {
            address {
              resolvedName {
                ...NounResolvedLinkFragment
              }
            }

            delegate {
              delegatedVotesRaw
              nounsRepresented {
                id
                ...NounImageFragment
              }
            }
          }
        }
      }
    `,
    {
      accountAddress: accountAddress ?? "",
      skip: !accountAddress,
    }
  );

  const result = useFragment(
    graphql`
      fragment CastVoteInputVoteButtonsFragment on Proposal
      @argumentDefinitions(address: { type: "String!" }) {
        actualStatus
        hasVoted: votes(where: { voter_contains_nocase: $address }) {
          id
        }
      }
    `,
    fragmentRef
  );

  const userVotes = address?.wrappedDelegate.delegate?.delegatedVotesRaw ?? 0;

  if (result.actualStatus !== "ACTIVE") {
    return <DisabledVoteButton reason="Not open to voting" />;
  } else if (!accountAddress) {
    return <DisabledVoteButton reason="Connect wallet to vote" />;
  } else if (result.hasVoted.length > 0) {
    return <DisabledVoteButton reason="Already voted" />;
  } else if (userVotes === 0) {
    return <DisabledVoteButton reason="No eligible votes" />; //no votes
  } else {
    return (
      <HStack gap="2">
        {(
          ["FOR", "AGAINST", "ABSTAIN"] as SupportTextProps["supportType"][]
        ).map((supportType) => (
          <VoteButton
            key={supportType}
            action={supportType}
            onClick={() => {
              onClick(supportType);
            }}
          />
        ))}
      </HStack>
    );
  }
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

export function DisabledVoteButton({ reason }: { reason: string }) {
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

export const voteButtonStyles = css`
  ${buttonStyles};
  height: ${theme.spacing["8"]};
  text-transform: capitalize;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: ${theme.borderRadius.md};
`;

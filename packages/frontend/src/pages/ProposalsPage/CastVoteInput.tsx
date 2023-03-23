import { css, cx } from "@emotion/css";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import {
  colorForSupportType,
  SupportTextProps,
} from "../DelegatePage/VoteDetailsContainer";
import { buttonStyles } from "../EditDelegatePage/EditDelegatePage";
import { useState } from "react";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay/hooks";
import { CastVoteInputVoteButtonsFragment$key } from "./__generated__/CastVoteInputVoteButtonsFragment.graphql";
import { CastVoteInputVoteButtonsQueryFragment$key } from "./__generated__/CastVoteInputVoteButtonsQueryFragment.graphql";

type Props = {
  onVoteClick: (
    supportType: SupportTextProps["supportType"],
    reason: string,
    address: string
  ) => void;
  className: string;
  framgnetRef: CastVoteInputVoteButtonsFragment$key;
  queryFragmentRef: CastVoteInputVoteButtonsQueryFragment$key;
};

export function CastVoteInput({
  onVoteClick,
  className,
  framgnetRef,
  queryFragmentRef,
}: Props) {
  const [reason, setReason] = useState<string>("");

  return (
    <div
      className={css`
        position: relative;
      `}
    >
      <div
        className={css`
          @media (max-width: ${theme.maxWidth["2xl"]}) {
            display: none;
          }
          width: 100%;
          height: ${theme.spacing["12"]};
          position: absolute;
          top: -64px;
          background: linear-gradient(
            0deg,
            rgba(255, 255, 255, 1) 0%,
            rgba(255, 255, 255, 0) 100%
          );
        `}
      ></div>
      <VStack
        className={cx(
          css`
            border: 1px solid #e0e0e0;
            border-radius: ${theme.borderRadius.lg};
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              margin-top: ${theme.spacing["1"]};
            }
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
              outline: 0;
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
            onClick={(supportType, address) =>
              onVoteClick(supportType, reason, address)
            }
            fragmentRef={framgnetRef}
            queryFragmentRef={queryFragmentRef}
          />
        </VStack>
      </VStack>
    </div>
  );
}

function VoteButtons({
  onClick,
  fragmentRef,
  queryFragmentRef,
}: {
  onClick: (
    nextSupportType: SupportTextProps["supportType"],
    address: string
  ) => void;
  fragmentRef: CastVoteInputVoteButtonsFragment$key;
  queryFragmentRef: CastVoteInputVoteButtonsQueryFragment$key;
}) {
  const result = useFragment(
    graphql`
      fragment CastVoteInputVoteButtonsFragment on Proposal {
        # eslint-disable-next-line relay/unused-fields
        id
        status
      }
    `,
    fragmentRef
  );

  const { delegate } = useFragment(
    graphql`
      fragment CastVoteInputVoteButtonsQueryFragment on Query
      @argumentDefinitions(
        address: { type: "String!" }
        skipAddress: { type: "Boolean!" }
      ) {
        delegate(addressOrEnsName: $address) @skip(if: $skipAddress) {
          address {
            address
          }

          delegateSnapshot(proposalId: $proposalId) {
            nounsRepresented {
              __typename
            }
          }

          proposalVote(proposalId: $proposalId) {
            __typename
          }

          liquidRepresentation(
            filter: {
              canVote: true
              currentlyActive: true
              forProposal: { proposalId: $proposalId }
            }
          ) {
            proxy {
              delegateSnapshot(proposalId: $proposalId) {
                nounsRepresented {
                  __typename
                }
              }

              proposalVote(proposalId: $proposalId) {
                __typename
              }
            }
          }
        }
      }
    `,
    queryFragmentRef
  );

  if (result.status !== "ACTIVE") {
    return <DisabledVoteButton reason="Not open to voting" />;
  }

  if (!delegate) {
    return <DisabledVoteButton reason="Connect wallet to vote" />;
  }

  const proposalVoteLots = [
    ...(() => {
      const hasTokenVoted = !!delegate.proposalVote;
      if (hasTokenVoted) {
        return [];
      }

      if (!delegate.delegateSnapshot.nounsRepresented.length) {
        return [];
      }

      return [
        {
          type: "TOKEN" as const,
        },
      ];
    })(),
    ...(() =>
      delegate.liquidRepresentation.flatMap((liquidRepresentation) => {
        if (
          !liquidRepresentation.proxy.delegateSnapshot.nounsRepresented.length
        ) {
          return [];
        }

        if (liquidRepresentation.proxy.proposalVote) {
          return [];
        }

        return [
          {
            type: "LIQUID" as const,
            liquidRepresentation,
          },
        ];
      }))(),
  ];

  if (!proposalVoteLots.length) {
    return <DisabledVoteButton reason="No available lots" />;
  }

  return (
    <HStack gap="2">
      {(["FOR", "AGAINST", "ABSTAIN"] as SupportTextProps["supportType"][]).map(
        (supportType) => (
          <VoteButton
            key={supportType}
            action={supportType}
            onClick={() => {
              onClick(supportType, delegate.address.address);
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

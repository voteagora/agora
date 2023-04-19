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
import { useAccount } from "wagmi";
import { generateUserView } from "./ProposalsAIPanel";
import { ChatCompletionRequestMessage } from "openai-streams";
import { CastVoteInputFragment$key } from "./__generated__/CastVoteInputFragment.graphql";
import { Tooltip } from "../../components/Tooltip";
import { CastVoteInputQueryFragment$key } from "./__generated__/CastVoteInputQueryFragment.graphql";
import { useGenerateChatGpt } from "../../hooks/useGenerateChatGpt";

type Props = {
  onVoteClick: (
    supportType: SupportTextProps["supportType"],
    reason: string,
    address: string
  ) => void;
  className: string;
  fragmentRef: CastVoteInputVoteButtonsFragment$key;
  queryFragmentRef: CastVoteInputVoteButtonsQueryFragment$key;
  delegateFragmentRef: CastVoteInputQueryFragment$key;
  proposalFragmentRef: CastVoteInputFragment$key;
};

export function CastVoteInput({
  onVoteClick,
  className,
  fragmentRef,
  queryFragmentRef,
  delegateFragmentRef,
  proposalFragmentRef,
}: Props) {
  const [reason, setReason] = useState("");

  const { generateChatGpt, isLoading } = useGenerateChatGpt();

  const { address } = useAccount();

  const { delegate } = useFragment(
    graphql`
      fragment CastVoteInputQueryFragment on Query
      @argumentDefinitions(
        address: { type: "String!" }
        skipAddress: { type: "Boolean!" }
      ) {
        delegate(addressOrEnsName: $address) @skip(if: $skipAddress) {
          statement {
            statement
            # eslint-disable-next-line relay/unused-fields
            topIssues {
              type
              value
            }
          }
        }
      }
    `,
    delegateFragmentRef
  );

  const proposal = useFragment(
    graphql`
      fragment CastVoteInputFragment on Proposal {
        description
      }
    `,
    proposalFragmentRef
  );

  const statement = delegate?.statement;

  const userView = statement ? generateUserView(statement) : "";

  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: `You are a governance assistant that helps voting on DAO proposals. Impersonate the user and reply with a reason to vote reflecting his beliefs. Do not exceed 500 characters in total. Always break lines between paragraphs.`,
    },
    {
      role: "user",
      content: userView,
    },
    {
      role: "user",
      content: `Starting with "I am voting", explain why I'm for, against or abstaining from voting on this proposal. Write as if you were me. Do it mentioning how my statement and views align or are in conflict with the following proposal:\n\n${proposal.description.slice(
        0,
        12000
      )}`,
    },
  ];

  const aiGenerationDisabled = !userView || isLoading;

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
      />
      <button
        className={
          buttonStyles +
          " " +
          css`
            position: absolute;
            top: -${theme.spacing["5"]};
            right: ${theme.spacing["4"]};
            width: fit-content;
            padding: ${theme.spacing["1"]} ${theme.spacing["3"]};

            :disabled {
              cursor: not-allowed;
            }

            &:hover > #tooltip {
              visibility: visible;
            }
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              top: -${theme.spacing["8"]};
            }
          `
        }
        onClick={async () =>
          statement && (await generateChatGpt(messages, setReason))
        }
        disabled={aiGenerationDisabled}
      >
        Auto-generate ✨
        {aiGenerationDisabled && (
          <Tooltip
            text={(() => {
              if (!address) {
                return "Connect your wallet";
              }
              if (!userView) {
                return "Delegate statement required to generate reason";
              }
              return "Generation in progress";
            })()}
            className={css`
              right: 0;
              font-size: ${theme.fontSize.xs};
            `}
          />
        )}
      </button>
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

            @media (min-width: ${theme.maxWidth["2xl"]}) {
              height: ${reason ? theme.spacing["40"] : theme.spacing["12"]};
              transition-property: height;
              transition-duration: 150ms;
            }
          `}
          placeholder="I believe..."
          value={reason ?? undefined}
          onChange={(e) => setReason(e.target.value)}
          disabled={isLoading}
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
            fragmentRef={fragmentRef}
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

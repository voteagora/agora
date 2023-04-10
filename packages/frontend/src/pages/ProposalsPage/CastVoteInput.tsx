import { css, cx } from "@emotion/css";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import {
  colorForSupportType,
  SupportTextProps,
} from "../DelegatePage/VoteDetailsContainer";
import { buttonStyles } from "../EditDelegatePage/EditDelegatePage";
import { useEffect, useState } from "react";
import graphql from "babel-plugin-relay/macro";
import { useFragment, useLazyLoadQuery } from "react-relay/hooks";
import {
  CastVoteInputVoteButtonsFragment$data,
  CastVoteInputVoteButtonsFragment$key,
} from "./__generated__/CastVoteInputVoteButtonsFragment.graphql";
import { CastVoteInputVoteButtonsQueryFragment$key } from "./__generated__/CastVoteInputVoteButtonsQueryFragment.graphql";
import { useAccount } from "wagmi";
import { CastVoteInputQuery } from "./__generated__/CastVoteInputQuery.graphql";
import { generateChatGpt, generateUserView } from "./ProposalsAIPanel";
import { ChatCompletionRequestMessage } from "openai-streams";
import {
  CastVoteInputFragment$data,
  CastVoteInputFragment$key,
} from "./__generated__/CastVoteInputFragment.graphql";
import { Tooltip } from "../../components/Tooltip";

type Props = {
  onVoteClick: (
    supportType: SupportTextProps["supportType"],
    reason: string,
    address: string
  ) => void;
  className: string;
  fragmentRef: CastVoteInputFragment$key | CastVoteInputVoteButtonsFragment$key;
  queryFragmentRef: CastVoteInputVoteButtonsQueryFragment$key;
};

export function CastVoteInput({
  onVoteClick,
  className,
  fragmentRef,
  queryFragmentRef,
}: Props) {
  const [isPending, setIsPending] = useState(false);

  const { address } = useAccount();

  const query = useLazyLoadQuery<CastVoteInputQuery>(
    graphql`
      query CastVoteInputQuery($addressOrEnsName: String!, $skip: Boolean!) {
        delegate(addressOrEnsName: $addressOrEnsName) @skip(if: $skip) {
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
    {
      addressOrEnsName: address ?? "",
      skip: !address,
    }
  );

  const proposal = useFragment(
    graphql`
      fragment CastVoteInputFragment on Proposal {
        id
        description
      }
    `,
    fragmentRef
  ) as CastVoteInputFragment$data;

  const proposalId = proposal.id.split("|").pop();

  const [reason, setReason] = useState<string>(
    localStorage.getItem(`${address}-${proposalId}-reason`)!
  );

  const statement = query?.delegate?.statement;

  const userView = statement ? generateUserView(statement) : "";

  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: `You are a governance assistant that helps voting on DAO proposals. Impersonate the user and reply with a reason to vote. Do not exceed 400 characters in total. Always break lines between paragraphs.`,
    },
    {
      role: "user",
      content: userView,
    },
    {
      role: "user",
      content: `Starting with "I am voting", explain why I'm for, against or abstaining from voting on this proposal. Write as if you were me. Do it mentioning how my statement and views align or are in conflict with the following proposal:\n\n${proposal.description}`,
    },
  ];

  useEffect(() => {
    if (address && proposalId) {
      localStorage.setItem(`${address}-${proposalId}-reason`, reason);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reason]);

  const aiGenerationDisabled = !userView || isPending;

  const tooltipText = !address
    ? "Connect your wallet"
    : !userView
    ? "Delegate statement required to generate reason"
    : "Generation in progress";

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
          value={reason ?? undefined}
          onChange={(e) => setReason(e.target.value)}
          disabled={isPending}
        />

        <button
          className={
            buttonStyles +
            " " +
            css`
              position: absolute;
              top: -18px;
              right: 16px;
              font-size: x-small;
              width: fit-content;
              padding: ${theme.spacing["1"]} ${theme.spacing["3"]};
              @media (max-width: ${theme.maxWidth["2xl"]}) {
                top: -30px;
              }
              :disabled {
                cursor: not-allowed;
              }

              &:hover .test {
                visibility: visible;
              }
            `
          }
          onClick={async () =>
            statement &&
            (await generateChatGpt(messages, setReason, setIsPending))
          }
          disabled={aiGenerationDisabled}
        >
          Auto-generate ✨
          {aiGenerationDisabled && (
            <Tooltip
              text={tooltipText}
              className={css`
                right: 0;
                font-size: ${theme.fontSize.xs};
              `}
            />
          )}
        </button>
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
  fragmentRef: CastVoteInputFragment$key | CastVoteInputVoteButtonsFragment$key;
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
  ) as CastVoteInputVoteButtonsFragment$data;

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

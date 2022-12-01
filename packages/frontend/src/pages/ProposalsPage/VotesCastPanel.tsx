import { HStack, VStack } from "../../components/VStack";
import { css, cx } from "@emotion/css";
import * as theme from "../../theme";
import { UserIcon } from "@heroicons/react/20/solid";
import { buttonStyles } from "../EditDelegatePage/EditDelegatePage";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { VotesCastPanelFragment$key } from "./__generated__/VotesCastPanelFragment.graphql";
import { VotesCastPanelBarFragment$key } from "./__generated__/VotesCastPanelBarFragment.graphql";
import { VotesCastPanelTextFragment$key } from "./__generated__/VotesCastPanelTextFragment.graphql";
import { VotesCastPanelTimeFragment$key } from "./__generated__/VotesCastPanelTimeFragment.graphql";
import { VotesCastPanelButtonsFragment$key } from "./__generated__/VotesCastPanelButtonsFragment.graphql";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import {
  colorForSupportType,
  SupportTextProps,
} from "../DelegatePage/VoteDetailsContainer";
import { useEffect, useState } from "react";
import { formatDistanceToNowStrict, formatISO9075 } from "date-fns";
import { useAccount } from "wagmi";
import { VoterCardFragment$key } from "../HomePage/__generated__/VoterCardFragment.graphql";
import { VoterCard } from "../HomePage/VoterCard";
import { VoteReason } from "../../components/VoteReason";
import { useOpenDialog } from "../../components/DialogProvider/DialogProvider";

export function VotesCastPanel({
  fragmentRef,
  expanded,
}: {
  fragmentRef: VotesCastPanelFragment$key;
  expanded: boolean;
}) {
  const [reason, setReason] = useState<string>("");
  const openDialog = useOpenDialog();

  const [hoveredVoter, setHoveredVoter] =
    useState<VoterCardFragment$key | null>(null);
  useEffect(() => {
    const handleClick = () => setHoveredVoter(null);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  });
  // TODO: What if there are more comments?
  const result = useFragment(
    graphql`
      fragment VotesCastPanelFragment on Proposal
      @argumentDefinitions(address: { type: "String!" }) {
        number
        forVotes
        againstVotes
        quorumVotes
        votes(first: 100, orderBy: blockNumber, orderDirection: desc) {
          id
          reason
          votes
          voter {
            address {
              wrappedDelegate {
                ...VoterCardFragment
              }
            }
            resolvedName {
              ...NounResolvedLinkFragment
            }
          }
          ...VotesCastPanelTextFragment
          ...VoteReasonFragment
        }
        ...VotesCastPanelBarFragment
        ...VotesCastPanelTimeFragment
        ...VotesCastPanelButtonsFragment @arguments(address: $address)
      }
    `,
    fragmentRef
  );
  const proposalListExpandedSize = css`
    padding: ${theme.spacing["4"]};
    font-size: ${theme.fontSize.xs};
    overflow-y: auto;
    height: 113px;
  `;

  const normalSize = css`
    padding: ${theme.spacing["4"]};
    font-size: ${theme.fontSize.xs};
    overflow-y: auto;
    height: calc(100vh - 223px - 80px);
  `;

  return (
    <>
      <VStack
        gap="8"
        justifyContent="space-between"
        className={cx(
          { [proposalListExpandedSize]: expanded },
          { [normalSize]: !expanded }
        )}
      >
        <VStack
          gap="2"
          className={css`
            font-weight: ${theme.fontWeight.semibold};
          `}
        >
          <HStack
            justifyContent="space-between"
            className={css`
              margin-top: ${theme.spacing[2]};
            `}
          >
            <div
              className={css`
                color: ${colorForSupportType("FOR")};
              `}
            >
              FOR &nbsp;{result.forVotes}
            </div>
            <div
              className={css`
                color: ${colorForSupportType("AGAINST")};
              `}
            >
              AGAINST &nbsp;{result.againstVotes}
            </div>
          </HStack>
          <VoteBar fragmentRef={result} />
          <HStack
            justifyContent="space-between"
            className={css`
              color: ${theme.colors.gray["4f"]};
            `}
          >
            <div>QUORUM {result.quorumVotes}</div>
            <VoteTime fragmentRef={result} />
          </HStack>
        </VStack>
        <VStack
          gap="5"
          className={css`
            overflow-y: auto;
          `}
        >
          {result.votes.map((vote) => (
            <VStack key={vote.id} gap="1">
              <HStack
                justifyContent="space-between"
                className={css`
                  font-weight: ${theme.fontWeight.semibold};
                  line-height: ${theme.lineHeight.none};
                  color: ${theme.colors.gray["800"]};
                `}
              >
                {hoveredVoter &&
                  vote.voter.address.wrappedDelegate === hoveredVoter && (
                    <div
                      className={css`
                        position: absolute;
                        width: ${theme.maxWidth.xs};
                        left: -${theme.maxWidth.xs};
                      `}
                    >
                      <VoterCard fragmentRef={hoveredVoter} />
                    </div>
                  )}
                <HStack gap="0">
                  {/* TODO: This is pretty inefficient, as we're fetching all of the voter card info even if not displaying data */}
                  <div
                    onMouseEnter={() =>
                      setHoveredVoter(vote.voter.address.wrappedDelegate)
                    }
                  >
                    <NounResolvedLink resolvedName={vote.voter.resolvedName!} />
                  </div>
                  <VoteText fragmentRef={vote} />
                </HStack>
                <HStack
                  gap="0"
                  className={css`
                    color: #66676b;
                  `}
                >
                  <div>{vote.votes}</div>
                  <div
                    className={css`
                      width: ${theme.spacing["4"]};
                      height: ${theme.spacing["4"]};
                    `}
                  >
                    <UserIcon />
                  </div>
                </HStack>
              </HStack>
              {vote.reason && <VoteReason fragmentKey={vote} />}
            </VStack>
          ))}
        </VStack>
        {
          <VStack
            className={css`
              border: 1px solid #e0e0e0;
              border-radius: ${theme.borderRadius.lg};
              height: ${theme.spacing["32"]};
            `}
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
            <HStack
              justifyContent="space-between"
              alignItems="center"
              className={css`
                padding-top: ${theme.spacing["1"]};
                padding-bottom: ${theme.spacing["3"]};
                padding-left: ${theme.spacing["3"]};
                padding-right: ${theme.spacing["3"]};
              `}
            >
              <VoteButtons
                fragmentRef={result}
                onVoteClicked={(supportType) =>
                  openDialog({
                    type: "CAST_VOTE",
                    params: {
                      reason,
                      supportType,
                      proposalId: result.number,
                    },
                  })
                }
              />
            </HStack>
          </VStack>
        }
      </VStack>
    </>
  );
}

function VoteButtons({
  fragmentRef,
  onVoteClicked,
}: {
  fragmentRef: VotesCastPanelButtonsFragment$key;
  onVoteClicked: (supportType: SupportTextProps["supportType"]) => void;
}) {
  const { address: accountAddress } = useAccount();
  const result = useFragment(
    graphql`
      fragment VotesCastPanelButtonsFragment on Proposal
      @argumentDefinitions(address: { type: "String!" }) {
        actualStatus
        hasVoted: votes(where: { voter_contains_nocase: $address }) {
          id
        }
      }
    `,
    fragmentRef
  );

  if (result.actualStatus !== "ACTIVE") {
    return <DisabledVoteButton reason="Not open to voting" />;
  } else if (!accountAddress) {
    return <DisabledVoteButton reason="Connect wallet to vote" />;
  } else if (result.hasVoted.length > 0) {
    return <DisabledVoteButton reason="Already voted" />;
  } else {
    return (
      <>
        {(
          ["FOR", "AGAINST", "ABSTAIN"] as SupportTextProps["supportType"][]
        ).map((supportType) => (
          <VoteButton
            key={supportType}
            action={supportType}
            onClick={() => {
              onVoteClicked(supportType);
            }}
          />
        ))}
      </>
    );
  }
}

function VoteTime({
  fragmentRef,
}: {
  fragmentRef: VotesCastPanelTimeFragment$key;
}) {
  const result = useFragment(
    graphql`
      fragment VotesCastPanelTimeFragment on Proposal {
        voteStartsAt
        voteEndsAt
      }
    `,
    fragmentRef
  );
  const now = Date.now() / 1000;

  let voteTime;
  let voteTextPrefix;
  // Display time until vote start if vote hasn't started yet.
  if (result.voteStartsAt > now) {
    voteTextPrefix = "VOTE STARTS IN";
    voteTime = result.voteStartsAt;
  } else {
    voteTime = result.voteEndsAt;
    if (result.voteEndsAt > now) {
      voteTextPrefix = "VOTE ENDS IN";
    } else {
      voteTextPrefix = "VOTE ENDED";
    }
  }

  const ago = formatDistanceToNowStrict(voteTime * 1000, { addSuffix: true });
  const text = `${voteTextPrefix} ${ago}`;
  return <span title={formatISO9075(voteTime * 1000)}>{text}</span>;
}

function VoteText({
  fragmentRef,
}: {
  fragmentRef: VotesCastPanelTextFragment$key;
}) {
  const { supportDetailed } = useFragment(
    graphql`
      fragment VotesCastPanelTextFragment on Vote {
        supportDetailed
      }
    `,
    fragmentRef
  );
  let text;
  let color;
  if (supportDetailed === 0) {
    text = "voted against";
    color = colorForSupportType("AGAINST");
  } else if (supportDetailed === 1) {
    text = "voted for";
    color = colorForSupportType("FOR");
  } else if (supportDetailed === 2) {
    // TODO: Ask Yitong about color and text
    text = "abstained";
    color = colorForSupportType("ABSTAIN");
  } else {
    // TODO: Better way of handling new vote modes
    throw new Error(`unknown vote type ${supportDetailed}`);
  }
  return (
    <div
      className={css`
        color: ${color};
      `}
    >
      &nbsp;{text}
    </div>
  );
}

function VoteBar({
  fragmentRef,
}: {
  fragmentRef: VotesCastPanelBarFragment$key;
}) {
  const { forVotes, againstVotes, abstainVotes } = useFragment(
    graphql`
      fragment VotesCastPanelBarFragment on Proposal {
        forVotes
        againstVotes
        abstainVotes
      }
    `,
    fragmentRef
  );
  const colors = [
    colorForSupportType("FOR"),
    colorForSupportType("ABSTAIN"),
    colorForSupportType("AGAINST"),
  ];
  const bars = roundMaintainSum([forVotes, abstainVotes, againstVotes], 57);
  return (
    <HStack justifyContent="space-between">
      {bars.map((barCount, idx) =>
        Array.from({ length: barCount }, (_, idy) => (
          <div
            key={`${idx}-${idy}`}
            className={css`
              background: ${colors[idx]};
              border-radius: ${theme.borderRadius.full};
              width: 2px;
              height: 12px;
            `}
          />
        ))
      )}
    </HStack>
  );
}

function roundMaintainSum(numberStrings: string[], base: number) {
  // Round numbers to integers while maintaining the sum
  // Generated by copilot
  const numbers = numberStrings.map((s) => parseInt(s));
  const sum = numbers.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    // When sum is 0, just set all bars to gray
    return numbers.map((_, idx) => (idx === 1 ? base : 0));
  }
  const rounded = numbers.map((n) => Math.round((n * base) / sum));
  const roundedSum = rounded.reduce((a, b) => a + b, 0);
  const diff = base - roundedSum;
  for (let i = 0; i < diff; i++) {
    rounded[i] += 1;
  }
  return rounded;
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
        width: ${theme.spacing["24"]};
      `}
      onClick={onClick}
    >
      {action.toLowerCase()}
    </button>
  );
}

function DisabledVoteButton({ reason }: { reason: string }) {
  return (
    <button
      disabled={true}
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

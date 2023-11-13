import { formatDistanceToNowStrict } from "date-fns";
import { HStack, VStack } from "../../components/VStack";
import TimestampTooltip from "../../components/TimestampTooltip";
import { ProposalVotesSummaryFragment$key } from "./__generated__/ProposalVotesSummaryFragment.graphql";
import { ProposalVotesSummaryVoteTimeFragment$key } from "./__generated__/ProposalVotesSummaryVoteTimeFragment.graphql";
import graphql from "babel-plugin-relay/macro";
import * as theme from "../../theme";
import { useFragment } from "react-relay";
import { colorForSupportType } from "../DelegatePage/VoteDetailsContainer";
import { css, cx } from "@emotion/css";
import { ProposalVotesSummaryVotesBarFragment$key } from "./__generated__/ProposalVotesSummaryVotesBarFragment.graphql";
import { TokenAmountDisplay } from "../../components/TokenAmountDisplay";
import { BigNumber } from "ethers";
import { generateBarsForVote } from "./generateBarsForVote";
import { ProposalVotesSummaryQuorumFragment$key } from "./__generated__/ProposalVotesSummaryQuorumFragment.graphql";
import { Tooltip } from "react-tooltip";

export function ProposalVotesSummary({
  fragmentRef,
  className,
  quorumVotesRef,
  propVotesSummaryRef,
}: {
  fragmentRef: ProposalVotesSummaryFragment$key;
  className: string;
  quorumVotesRef: ProposalVotesSummaryQuorumFragment$key;
  propVotesSummaryRef: ProposalVotesSummaryVoteTimeFragment$key;
}) {
  const proposalData = useFragment(
    graphql`
      fragment ProposalVotesSummaryFragment on StandardProposalData {
        forVotes {
          ...TokenAmountDisplayFragment
        }
        againstVotes {
          ...TokenAmountDisplayFragment
        }
        abstainVotes {
          ...TokenAmountDisplayFragment
        }

        ...ProposalVotesSummaryVotesBarFragment
      }
    `,
    fragmentRef
  );

  const quorumData = useFragment(
    graphql`
      fragment ProposalVotesSummaryQuorumFragment on Proposal {
        quorumVotes {
          ...TokenAmountDisplayFragment
        }
      }
    `,
    quorumVotesRef
  );

  return (
    <VStack
      gap="2"
      className={cx(
        css`
          font-weight: ${theme.fontWeight.semibold};
        `,
        className
      )}
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
          FOR <TokenAmountDisplay fragment={proposalData.forVotes} />
        </div>
        <div
          className={css`
            color: ${colorForSupportType("AGAINST")};
          `}
        >
          AGAINST <TokenAmountDisplay fragment={proposalData.againstVotes} />
        </div>
      </HStack>
      <VotesBar fragmentRef={proposalData} />
      <HStack
        justifyContent="space-between"
        className={css`
          color: ${theme.colors.gray["4f"]};
        `}
      >
        <div>
          QUORUM <TokenAmountDisplay fragment={quorumData.quorumVotes} />
        </div>
        <VoteTime fragmentRef={propVotesSummaryRef} />
      </HStack>
    </VStack>
  );
}

function VoteTime({
  fragmentRef,
}: {
  fragmentRef: ProposalVotesSummaryVoteTimeFragment$key;
}) {
  const result = useFragment(
    graphql`
      fragment ProposalVotesSummaryVoteTimeFragment on Proposal {
        voteStartsAt
        voteEndsAt
      }
    `,
    fragmentRef
  );
  const now = Date.now();

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

  const ago = formatDistanceToNowStrict(voteTime, { addSuffix: true });
  const text = `${voteTextPrefix} ${ago}`;
  return <TimestampTooltip date={voteTime}>{text}</TimestampTooltip>;
}

function VotesBar({
  fragmentRef,
}: {
  fragmentRef: ProposalVotesSummaryVotesBarFragment$key;
}) {
  const proposalData = useFragment(
    graphql`
      fragment ProposalVotesSummaryVotesBarFragment on StandardProposalData {
        forVotes {
          amount
          ...TokenAmountDisplayFragment
        }
        againstVotes {
          amount
          ...TokenAmountDisplayFragment
        }
        abstainVotes {
          amount
          ...TokenAmountDisplayFragment
        }
      }
    `,
    fragmentRef
  );

  return (
    <VotesBarTooltip abstainVotes={proposalData.abstainVotes}>
      <HStack justifyContent="space-between">
        {Array.from(
          generateBarsForVote(
            BigNumber.from(proposalData.forVotes.amount),
            BigNumber.from(proposalData.abstainVotes.amount),
            BigNumber.from(proposalData.againstVotes.amount)
          )
        ).map((value, idx) => (
          <div
            key={`${idx}`}
            className={css`
              background: ${colorForSupportType(value)};
              border-radius: ${theme.borderRadius.full};
              width: 2px;
              height: 12px;
            `}
          />
        ))}
      </HStack>
    </VotesBarTooltip>
  );
}

function VotesBarTooltip({
  children,
  abstainVotes,
}: {
  children: React.ReactNode;
  abstainVotes: any;
}) {
  return (
    <>
      <div
        className={css`
          cursor: help;
        `}
        data-tooltip-id={abstainVotes.toString()}
      >
        <Tooltip id={abstainVotes.toString()}>
          <div
            className={css`
              font-size: 12px;
              line-height: 16px;
              font-weight: ${theme.fontWeight.normal};
              color: ${theme.colors.gray[200]};
            `}
          >
            <TokenAmountDisplay fragment={abstainVotes} /> abstained
          </div>
        </Tooltip>
        {children}
      </div>
    </>
  );
}

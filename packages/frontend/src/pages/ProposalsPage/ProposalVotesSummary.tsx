import { formatDistanceToNowStrict, formatISO9075 } from "date-fns";
import { HStack, VStack } from "../../components/VStack";
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

export function ProposalVotesSummary({
  fragmentRef,
  className,
}: {
  fragmentRef: ProposalVotesSummaryFragment$key;
  className: string;
}) {
  const proposal = useFragment(
    graphql`
      fragment ProposalVotesSummaryFragment on Proposal {
        forVotes {
          ...TokenAmountDisplayFragment
        }
        againstVotes {
          ...TokenAmountDisplayFragment
        }

        ...ProposalVotesSummaryVotesBarFragment
        ...ProposalVotesSummaryVoteTimeFragment
      }
    `,
    fragmentRef
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
          FOR <TokenAmountDisplay fragment={proposal.forVotes} />
        </div>
        <div
          className={css`
            color: ${colorForSupportType("AGAINST")};
          `}
        >
          AGAINST <TokenAmountDisplay fragment={proposal.againstVotes} />
        </div>
      </HStack>
      <VotesBar fragmentRef={proposal} />
      <HStack
        justifyContent="space-between"
        className={css`
          color: ${theme.colors.gray["4f"]};
        `}
      >
        <div>QUORUM 12.0M OP</div>
        <VoteTime fragmentRef={proposal} />
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
  return <span title={formatISO9075(voteTime)}>{text}</span>;
}

function VotesBar({
  fragmentRef,
}: {
  fragmentRef: ProposalVotesSummaryVotesBarFragment$key;
}) {
  const { forVotes, againstVotes, abstainVotes } = useFragment(
    graphql`
      fragment ProposalVotesSummaryVotesBarFragment on Proposal {
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
    <HStack justifyContent="space-between">
      {Array.from(
        generateBarsForVote(
          BigNumber.from(forVotes.amount),
          BigNumber.from(abstainVotes.amount),
          BigNumber.from(againstVotes.amount)
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
  );
}

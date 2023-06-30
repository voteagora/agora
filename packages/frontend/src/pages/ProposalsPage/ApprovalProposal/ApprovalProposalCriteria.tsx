import { formatDistanceToNowStrict, formatISO9075 } from "date-fns";
import graphql from "babel-plugin-relay/macro";
import { BigNumber } from "ethers";
import { useFragment } from "react-relay";
import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { HStack, VStack } from "../../../components/VStack";
import { ApprovalProposalCriteriaFragment$key } from "./__generated__/ApprovalProposalCriteriaFragment.graphql";
import { ApprovalProposalCriteriaQuorumVotesFragment$key } from "./__generated__/ApprovalProposalCriteriaQuorumVotesFragment.graphql";
import {
  TokenAmountDisplay,
  formatNumber,
} from "../../../components/TokenAmountDisplay";
import { ApprovalProposalCriteriaVoteTimeFragment$key } from "./__generated__/ApprovalProposalCriteriaVoteTimeFragment.graphql";

type Props = {
  fragmentRef: ApprovalProposalCriteriaFragment$key;
  proposalRef: ApprovalProposalCriteriaQuorumVotesFragment$key;
};

export function ApprovalProposalCriteria({ fragmentRef, proposalRef }: Props) {
  const proposalData = useFragment(
    graphql`
      fragment ApprovalProposalCriteriaFragment on ApprovalVotingProposalData {
        forVotes {
          amount
          decimals
        }
        abstainVotes {
          amount
        }
        settings {
          criteria {
            __typename
            ... on ThresholdVotingCriteria {
              threshold {
                ...TokenAmountDisplayFragment
              }
            }
            ... on TopChoicesVotingCriteria {
              topChoices
            }
          }
          budget {
            ...TokenAmountDisplayFragment
          }
          maxApprovals
        }
      }
    `,
    fragmentRef
  );

  const quorumVotes = useFragment(
    graphql`
      fragment ApprovalProposalCriteriaQuorumVotesFragment on Proposal {
        quorumVotes {
          ...TokenAmountDisplayFragment
        }
        ...ApprovalProposalCriteriaVoteTimeFragment
      }
    `,
    proposalRef
  );

  const totalVotingPower = formatNumber(
    BigNumber.from(proposalData.forVotes.amount).add(
      BigNumber.from(proposalData.abstainVotes.amount)
    ),
    proposalData.forVotes.decimals
  );

  return (
    <VStack
      className={css`
        padding: ${theme.spacing["4"]};
        padding-bottom: ${theme.spacing["2"]};
        border-top: 1px solid ${theme.colors.gray.eb};
      `}
    >
      <HStack
        className={css`
          justify-content: space-between;
          font-size: ${theme.fontSize.xs};
          font-weight: ${theme.fontWeight.semibold};
          color: ${theme.colors.gray[700]};
        `}
      >
        <div>
          <p>
            QUORUM {totalVotingPower.toString()} /{" "}
            <TokenAmountDisplay fragment={quorumVotes.quorumVotes} />
          </p>
        </div>
        <div>
          <VoteTime fragmentRef={quorumVotes} />
        </div>
      </HStack>
      <div
        className={css`
          font-size: ${theme.fontSize.xs};
          padding-top: ${theme.spacing["2"]};
          color: ${theme.colors.gray[700]};
          font-weight: ${theme.fontWeight.semibold};
        `}
      >
        {/* {totalVotingPower.toString()} */}
        {proposalData.settings.criteria.__typename ===
          "TopChoicesVotingCriteria" && (
          <p>
            In this top-choices style approval voting proposal, the top{" "}
            {proposalData.settings.criteria.topChoices} options will be
            executed. Each voter can select up to{" "}
            {proposalData.settings.maxApprovals} options to vote for. If the
            quorum is not met, no options will be executed.
          </p>
        )}
        {proposalData.settings.criteria.__typename ===
          "ThresholdVotingCriteria" && (
          <p>
            In this threshold-based approval voting proposal, all options
            passing the approval threshold of{" "}
            <TokenAmountDisplay
              fragment={proposalData.settings.criteria.threshold}
            />{" "}
            votes will be executed in order from most to least popular, until
            the total budget of{" "}
            <TokenAmountDisplay fragment={proposalData.settings.budget} /> runs
            out. Each voter can select up to{" "}
            {proposalData.settings.maxApprovals} options to vote for. If the
            quorum is not met, no options will be executed.
          </p>
        )}
      </div>
    </VStack>
  );
}

// TODO merge this with the one in ProposalsVoteSummary.tsx
function VoteTime({
  fragmentRef,
}: {
  fragmentRef: ApprovalProposalCriteriaVoteTimeFragment$key;
}) {
  const result = useFragment(
    graphql`
      fragment ApprovalProposalCriteriaVoteTimeFragment on Proposal {
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
      voteTextPrefix = "VOTE ENDS";
    } else {
      voteTextPrefix = "VOTE ENDED";
    }
  }

  const ago = formatDistanceToNowStrict(voteTime, { addSuffix: true });
  const text = `${voteTextPrefix} ${ago}`;
  return (
    <span
      className={css`
        text-transform: uppercase;
      `}
      title={formatISO9075(voteTime)}
    >
      {text}
    </span>
  );
}

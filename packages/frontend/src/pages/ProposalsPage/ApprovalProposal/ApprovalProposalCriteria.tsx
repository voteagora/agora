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
        padding-bottom: 0;
        border-top: 1px solid ${theme.colors.gray.eb};
      `}
    >
      <HStack
        className={css`
          justify-content: space-between;
          font-size: ${theme.fontSize.xs};
          font-weight: ${theme.fontWeight.semibold};
          color: ${theme.colors.gray[800]};
        `}
      >
        <div>
          <p>
            QUORUM <TokenAmountDisplay fragment={quorumVotes.quorumVotes} />
          </p>
        </div>
        <div>
          <VoteTime fragmentRef={quorumVotes} />
        </div>
      </HStack>
      <div
        className={css`
          font-size: ${theme.fontSize.xs};
          padding-top: ${theme.spacing["4"]};
          color: ${theme.colors.gray["4f"]};
          font-weight: ${theme.fontWeight.semibold};
        `}
      >
        {proposalData.settings.criteria.__typename ===
          "TopChoicesVotingCriteria" && (
          <p>
            {totalVotingPower.toString()}/
            <TokenAmountDisplay fragment={quorumVotes.quorumVotes} /> votes
            required for top {proposalData.settings.criteria.topChoices} options
            to execute.
          </p>
        )}
        {proposalData.settings.criteria.__typename ===
          "ThresholdVotingCriteria" && (
          <p>
            All options with &gt;{" "}
            <TokenAmountDisplay
              fragment={proposalData.settings.criteria.threshold}
            />{" "}
            will be approved.
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
      voteTextPrefix = "VOTE ENDS IN";
    } else {
      voteTextPrefix = "VOTE ENDED";
    }
  }

  const ago = formatDistanceToNowStrict(voteTime, { addSuffix: true });
  const text = `${voteTextPrefix} ${ago}`;
  return <span title={formatISO9075(voteTime)}>{text}</span>;
}

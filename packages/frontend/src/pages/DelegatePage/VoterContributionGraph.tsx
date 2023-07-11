import { useFragment, graphql } from "react-relay";
import { FC, useEffect, useRef } from "react";
import { css } from "@emotion/css";
import { Tooltip } from "react-tooltip";

import * as theme from "../../theme";
import { VStack, HStack } from "../../components/VStack";
import { NounResolvedName } from "../../components/NounResolvedName";

import { VoterContributionGraphFragment$key } from "./__generated__/VoterContributionGraphFragment.graphql";
import { OnChainProposal } from "./PastVotes";

type Props = {
  pastVotesFragmentRef: VoterContributionGraphFragment$key;
  onChainProposals: readonly OnChainProposal[];
};

type Vote = {
  id: string;
  proposal: {
    id: string;
  };
  reason: string;
  supportDetailed: number;
};

const matchProposalsWithVotes = (
  onChainProposals: readonly OnChainProposal[],
  votes: readonly Vote[]
) => {
  return onChainProposals
    .map((proposal) => {
      const matchingVote = votes.find(
        (vote) => vote.proposal.id === proposal.id
      );

      let voterContribution = "NO PARTICIPATION";
      if (matchingVote) {
        const reasonNotEmpty = matchingVote.reason.trim() !== "";
        switch (matchingVote.supportDetailed) {
          case 0:
            voterContribution = reasonNotEmpty
              ? "AGAINST WITH REASON"
              : "AGAINST WITHOUT REASON";
            break;
          case 1:
            voterContribution = reasonNotEmpty
              ? "FOR WITH REASON"
              : "FOR WITHOUT REASON";
            break;
          case 2:
            voterContribution = reasonNotEmpty
              ? "ABSTAIN WITH REASON"
              : "ABSTAIN WITHOUT REASON";
            break;
          default:
            break;
        }
      }

      return {
        proposalId: proposal.id,
        number: proposal.number,
        status: proposal.status,
        title: proposal.title,
        voteEndsAt: proposal.voteEndsAt,
        voterContribution: voterContribution,
      };
    })
    .reverse();
};

type ContributionStatus =
  | "NO PARTICIPATION"
  | "AGAINST WITH REASON"
  | "AGAINST WITHOUT REASON"
  | "FOR WITH REASON"
  | "FOR WITHOUT REASON"
  | "ABSTAIN WITH REASON"
  | "ABSTAIN WITHOUT REASON";

function toProperCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Define color scheme for the grid
const COLORS: Record<ContributionStatus, string> = {
  "NO PARTICIPATION": "#EDECEB",
  "AGAINST WITH REASON": "#EA8767",
  "AGAINST WITHOUT REASON": "#FAC0AE",
  "FOR WITH REASON": "#2F9F13",
  "FOR WITHOUT REASON": "#7CCC69",
  "ABSTAIN WITH REASON": "#AFAFAF",
  "ABSTAIN WITHOUT REASON": "#E0E0E0",
};

// Define number of proposals per column
const proposalsPerColumn = 5;

export const VoterContributionGraph: FC<Props> = ({
  pastVotesFragmentRef,
  onChainProposals,
}) => {
  const { votes, address, delegateMetrics } = useFragment(
    graphql`
      fragment VoterContributionGraphFragment on Delegate {
        address {
          resolvedName {
            ...NounResolvedNameFragment
          }
        }
        delegateMetrics {
          forVotes
          againstVotes
          abstainVotes
        }
        votes {
          id
          supportDetailed
          reason
          proposal {
            id
          }
        }
      }
    `,
    pastVotesFragmentRef
  );

  // let people scroll
  const matchedProposals = matchProposalsWithVotes(onChainProposals, votes);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.scrollLeft = scrollElement.scrollWidth;
    }
  }, []);

  return (
    <VStack
      className={css`
        border-radius: ${theme.borderRadius.lg};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray.eb};
        background: ${theme.colors.white};
        box-shadow: ${theme.boxShadow.newDefault};
        padding: ${theme.spacing[4]} ${theme.spacing[6]} ${theme.spacing[6]}
          ${theme.spacing[6]};
        gap: ${theme.spacing[2]};
      `}
    >
      <HStack
        justifyContent="space-between"
        alignItems="center"
        className={css`
          width: 100%;
          @media (max-width: ${theme.maxWidth.lg}) {
            flex-direction: column;
            align-items: flex-start;
            gap: ${theme.spacing[1]};
          }
        `}
      >
        <div
          className={css`
            font-weight: ${theme.fontWeight.semibold};
          `}
        >
          <NounResolvedName resolvedName={address.resolvedName} />
          's vote history
        </div>
        <HStack
          gap="1"
          className={css`
            font-size: ${theme.fontSize.xs};
            color: ${theme.colors.gray[700]};
            font-weight: ${theme.fontWeight.medium};
          `}
        >
          <div>For {delegateMetrics.forVotes}</div>
          <div
            className={css`
              color: ${theme.colors.gray[300]};
            `}
          >
            |
          </div>
          <div>Against {delegateMetrics.againstVotes}</div>
          <div
            className={css`
              color: ${theme.colors.gray[300]};
            `}
          >
            |
          </div>
          <div>Abstain {delegateMetrics.abstainVotes}</div>
        </HStack>
      </HStack>
      <div>
        <div
          ref={scrollRef}
          className={css`
            display: inline-grid;
            grid-template-rows: repeat(${proposalsPerColumn}, 1fr);
            grid-row-gap: 2px;
            grid-auto-flow: column;
            gap: 4px;
            border: none;
            overflow-x: scroll;
            max-width: 100%;
            @media (max-width: ${theme.maxWidth.lg}) {
              max-width: calc(100vw - 88px);
            }
          `}
        >
          {matchedProposals.map(
            ({ number, title, status, voterContribution }, i) => (
              <div
                key={i}
                data-tooltip-id={`tooltip-${i}`}
                className={css`
                  width: ${theme.spacing[4]};
                  height: ${theme.spacing[4]};
                  border: 1px solid rgba(0, 0, 0, 0.1);
                  border-radius: ${theme.borderRadius.sm};
                  background-color: ${COLORS[
                    voterContribution as ContributionStatus
                  ]};
                `}
              >
                <Tooltip id={`tooltip-${i}`}>
                  <div>
                    <span>Proposal Number:</span> {number}
                  </div>
                  <div>
                    <span>Title:</span> {title}
                  </div>
                  <div>
                    <span>Status:</span> {toProperCase(status)}
                  </div>
                  <div>
                    <span>Vote:</span>{" "}
                    {toProperCase(voterContribution as ContributionStatus)}
                  </div>
                </Tooltip>
              </div>
            )
          )}
        </div>
      </div>
    </VStack>
  );
};

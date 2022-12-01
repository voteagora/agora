import { HStack, VStack } from "../../components/VStack";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { UserIcon } from "@heroicons/react/20/solid";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { VotesCastPanelFragment$key } from "./__generated__/VotesCastPanelFragment.graphql";
import { VotesCastPanelTextFragment$key } from "./__generated__/VotesCastPanelTextFragment.graphql";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import {
  colorForSupportType,
  toSupportType,
} from "../DelegatePage/VoteDetailsContainer";
import { useEffect, useState } from "react";
import { VoterCardFragment$key } from "../HomePage/__generated__/VoterCardFragment.graphql";
import { VoterCard } from "../HomePage/VoterCard";
import { VoteReason } from "../../components/VoteReason";
import { useOpenDialog } from "../../components/DialogProvider/DialogProvider";
import { CastVoteInput } from "./CastVoteInput";
import { ProposalVotesSummary } from "./ProposalVotesSummary";

export function VotesCastPanel({
  fragmentRef,
  expanded,
}: {
  fragmentRef: VotesCastPanelFragment$key;
  expanded: boolean;
}) {
  const openDialog = useOpenDialog();

  // todo: implement this in a bit less hacky way
  const [hoveredVoter, setHoveredVoter] =
    useState<VoterCardFragment$key | null>(null);

  useEffect(() => {
    const handleClick = () => setHoveredVoter(null);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  });

  const result = useFragment(
    graphql`
      fragment VotesCastPanelFragment on Proposal
      @argumentDefinitions(address: { type: "String!" }) {
        number
        forVotes
        againstVotes
        quorumVotes
        votes(first: 1000, orderBy: blockNumber, orderDirection: desc) {
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
        ...ProposalVotesSummaryFragment
        ...CastVoteInputFragment @arguments(address: $address)
      }
    `,
    fragmentRef
  );

  // todo: filter votes

  return (
    <>
      <VStack
        gap="8"
        justifyContent="space-between"
        className={css`
          padding: ${theme.spacing["4"]};
          font-size: ${theme.fontSize.xs};
        `}
      >
        <ProposalVotesSummary fragmentRef={result} />

        {!expanded && (
          <VStack gap="4">
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
                      <div
                        onMouseEnter={() =>
                          setHoveredVoter(vote.voter.address.wrappedDelegate)
                        }
                      >
                        <NounResolvedLink
                          resolvedName={vote.voter.resolvedName!}
                        />
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

            <CastVoteInput
              fragmentRef={result}
              onVoteClick={(supportType, reason) => {
                openDialog({
                  type: "CAST_VOTE",
                  params: {
                    reason,
                    supportType,
                    proposalId: result.number,
                  },
                });
              }}
            />
          </VStack>
        )}
      </VStack>
    </>
  );
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

  const supportType = toSupportType(supportDetailed);

  return (
    <div
      className={css`
        color: ${colorForSupportType(supportType)};
      `}
    >
      &nbsp;
      {(() => {
        switch (supportType) {
          case "AGAINST":
            return "voted against";

          case "ABSTAIN":
            return "abstained";

          case "FOR":
            return "voted for";
        }
      })()}
    </div>
  );
}

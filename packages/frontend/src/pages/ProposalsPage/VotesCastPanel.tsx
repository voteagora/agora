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
        justifyContent="space-between"
        gap="4"
        className={css`
          padding-top: ${theme.spacing["4"]};
          padding-bottom: ${theme.spacing["4"]};
          font-size: ${theme.fontSize.xs};
          min-height: 0;
        `}
      >
        <VStack
          gap="4"
          className={css`
            min-height: 0;
            flex-shrink: 1;
            padding-left: ${theme.spacing["4"]};
            padding-right: ${theme.spacing["4"]};
            max-height: 60vh;
            overflow-y: scroll;
          `}
        >
          <ProposalVotesSummary
            fragmentRef={result}
            className={css`
              flex-shrink: 0;
            `}
          />

          {!expanded && (
            <VStack gap="4">
              {result.votes.map((vote) => (
                <VStack key={vote.id} gap="1">
                  <VStack>
                    {hoveredVoter &&
                      vote.voter.address.wrappedDelegate === hoveredVoter && (
                        <div
                          className={css`
                            position: absolute;
                            top: calc(50% - 200px);
                            width: ${theme.maxWidth.xs};
                            left: -${theme.maxWidth.xs};
                          `}
                        >
                          <VoterCard fragmentRef={hoveredVoter} />
                        </div>
                      )}

                    <HStack
                      justifyContent="space-between"
                      className={css`
                        color: ${theme.colors.gray["800"]};
                        font-weight: ${theme.fontWeight.semibold};
                        font-size: ${theme.fontSize.xs};
                      `}
                    >
                      <HStack>
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
                        gap="1"
                        alignItems="center"
                        className={css`
                          color: #66676b;
                          font-size: ${theme.fontSize.xs};
                        `}
                      >
                        <div>{vote.votes}</div>

                        <div
                          className={css`
                            width: ${theme.spacing["3"]};
                            height: ${theme.spacing["3"]};
                          `}
                        >
                          <UserIcon />
                        </div>
                      </HStack>
                    </HStack>
                  </VStack>

                  {vote.reason && <VoteReason fragmentKey={vote} />}
                </VStack>
              ))}
            </VStack>
          )}
        </VStack>

        {!expanded && (
          <CastVoteInput
            className={css`
              flex-shrink: 0;
              margin-left: ${theme.spacing["4"]};
              margin-right: ${theme.spacing["4"]};
            `}
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

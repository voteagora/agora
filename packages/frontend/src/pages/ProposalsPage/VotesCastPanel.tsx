import { VStack, HStack } from "../../components/VStack";
import { css, keyframes } from "@emotion/css";
import * as theme from "../../theme";
import { useFragment, usePaginationFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { VotesCastPanelFragment$key } from "./__generated__/VotesCastPanelFragment.graphql";
import { useOpenDialog } from "../../components/DialogProvider/DialogProvider";
import { CastVoteInput } from "./CastVoteInput";
import { ProposalVotesSummary } from "./ProposalVotesSummary";
import { useStartTransition } from "../../components/HammockRouter/HammockRouter";
import { VoteRow } from "./VoteRow";
import { VotesCastPanelVotesFragment$key } from "./__generated__/VotesCastPanelVotesFragment.graphql";
import { makePaginationItems } from "../../hooks/pagination";
import { InView } from "react-intersection-observer";
import { Suspense, useEffect, useState } from "react";
import { useLazyLoadQuery } from "react-relay/hooks";
import { VotesCastPanelHoveredVoterQuery } from "./__generated__/VotesCastPanelHoveredVoterQuery.graphql";
import { VoterCard } from "../HomePage/VoterCard";

export function VotesCastPanel({
  fragmentRef,
  queryFragmentRef,
  expanded,
}: {
  fragmentRef: VotesCastPanelFragment$key;
  queryFragmentRef: VotesCastPanelVotesFragment$key;
  expanded: boolean;
}) {
  const [hoveredVoterAddress, setHoveredVoterAddress] = useState<string | null>(
    null
  );

  // todo: this is a very jank ui
  useEffect(() => {
    const handleClick = () => setHoveredVoterAddress(null);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  });

  const startTransition = useStartTransition();
  const openDialog = useOpenDialog();

  const result = useFragment(
    graphql`
      fragment VotesCastPanelFragment on Proposal {
        number

        ...ProposalVotesSummaryFragment
        ...CastVoteInputVoteButtonsFragment
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
          padding-top: ${theme.spacing["3"]};
          padding-bottom: ${theme.spacing["6"]};
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
            overflow-y: scroll;
          `}
        >
          {hoveredVoterAddress && (
            <div
              className={css`
                position: absolute;
                width: calc(100% - 2 * ${theme.spacing["4"]});
                right: calc(100% + ${theme.spacing["4"]});
              `}
            >
              <Suspense
                fallback={
                  <VStack
                    gap="8"
                    className={css`
                      height: 100%;
                      padding: ${theme.spacing["6"]};
                      border-radius: ${theme.spacing["3"]};
                      background: ${theme.colors.white};
                      border-width: ${theme.spacing.px};
                      border-color: ${theme.colors.gray["eb"]};
                      box-shadow: ${theme.boxShadow.newDefault};
                      cursor: pointer;
                    `}
                  >
                    <HStack gap="4">
                      <div
                        className={css`
                          width: 44px;
                          height: 44px;
                          border-radius: ${theme.borderRadius.full};
                          background: ${theme.colors.gray["eb"]};
                        `}
                      />
                      <VStack gap="2" justifyContent="center">
                        <div
                          className={css`
                            width: 120px;
                            height: 12px;
                            border-radius: ${theme.borderRadius.sm};
                            background: ${theme.colors.gray["eb"]};
                          `}
                        />
                        <div
                          className={css`
                            width: 64px;
                            height: 12px;
                            border-radius: ${theme.borderRadius.sm};
                            background: ${theme.colors.gray["eb"]};
                          `}
                        />
                      </VStack>
                    </HStack>
                    <div
                      className={css`
                        height: 44px;
                        width: 100%;
                        border-radius: ${theme.borderRadius.md};
                        background: ${theme.colors.gray["eb"]};
                      `}
                    />
                  </VStack>
                }
              >
                <HoveredVoter hoveredVoterAddress={hoveredVoterAddress} />
              </Suspense>
            </div>
          )}

          <ProposalVotesSummary
            fragmentRef={result}
            className={css`
              flex-shrink: 0;
            `}
          />

          {!expanded && (
            <VotesCastPanelVotes
              onVoterHovered={(address) => setHoveredVoterAddress(address)}
              fragmentRef={queryFragmentRef}
            />
          )}
        </VStack>

        {!expanded && (
          <CastVoteInput
            framgnetRef={result}
            className={css`
              flex-shrink: 0;
              margin-left: ${theme.spacing["4"]};
              margin-right: ${theme.spacing["4"]};
            `}
            onVoteClick={(supportType, reason) => {
              startTransition(() => {
                openDialog({
                  type: "CAST_VOTE",
                  params: {
                    reason,
                    supportType,
                    proposalId: result.number,
                  },
                });
              });
            }}
          />
        )}
      </VStack>
    </>
  );
}

function VotesCastPanelVotes({
  onVoterHovered,
  fragmentRef,
}: {
  onVoterHovered: (address: string) => void;
  fragmentRef: VotesCastPanelVotesFragment$key;
}) {
  const {
    data: { votes },
    loadNext,
    hasNext,
    isLoadingNext,
  } = usePaginationFragment(
    graphql`
      fragment VotesCastPanelVotesFragment on Query
      @argumentDefinitions(
        proposalId: { type: "ID!" }
        first: { type: "Int", defaultValue: 30 }
        after: { type: "String" }
      )
      @refetchable(queryName: "VotesCastPanelPaginationQuery") {
        votes(proposalId: $proposalId, first: $first, after: $after)
          @connection(key: "VotesCastPanelFragment_votes") {
          edges {
            node {
              voter {
                address {
                  address
                }
              }
              ...VoteRowFragment
            }
          }
        }
      }
    `,
    fragmentRef
  );

  const pageSize = 100;

  const items = makePaginationItems(votes.edges, isLoadingNext, hasNext);
  const shimmer = keyframes`
  from {
    opacity: 0.4;
  }
  
  to {
    opacity: 0.7;
  }
`;
  return (
    <VStack gap="4">
      {items.map((item, idx) => {
        switch (item.type) {
          case "LOADING": {
            return (
              <HStack
                justifyContent="center"
                key={idx}
                className={css`
                  color: ${theme.colors.gray["700"]};
                  font-weight: ${theme.fontWeight.medium};
                  animation: ${shimmer} 0.5s alternate-reverse infinite
                    ease-in-out;
                `}
              >
                Loading more votes
              </HStack>
            );
          }

          case "ITEMS": {
            return (
              <div
                key={idx}
                onMouseEnter={() =>
                  onVoterHovered(item.items.node.voter.address.address)
                }
              >
                <VoteRow fragmentRef={item.items.node} />
              </div>
            );
          }

          case "LOAD_MORE_SENTINEL": {
            return (
              <LoadMoreSentinel
                onVisible={() => {
                  loadNext(pageSize);
                }}
              />
            );
          }

          default: {
            throw new Error("unknown");
          }
        }
      })}
    </VStack>
  );
}

type HoveredVoterProps = {
  hoveredVoterAddress: string;
};

function HoveredVoter({ hoveredVoterAddress }: HoveredVoterProps) {
  const { delegate } = useLazyLoadQuery<VotesCastPanelHoveredVoterQuery>(
    graphql`
      query VotesCastPanelHoveredVoterQuery($voter: String!) {
        delegate(addressOrEnsName: $voter) {
          ...VoterCardFragment
        }
      }
    `,
    {
      voter: hoveredVoterAddress,
    }
  );

  return <VoterCard fragmentRef={delegate} />;
}

type LoadingProps = {
  onVisible: () => void;
};

function LoadMoreSentinel({ onVisible }: LoadingProps) {
  return (
    <InView
      onChange={(inView) => {
        if (inView) {
          onVisible();
        }
      }}
    />
  );
}

import { css, keyframes, cx } from "@emotion/css";
import { useFragment, usePaginationFragment, graphql } from "react-relay";
import { InView } from "react-intersection-observer";
import { Suspense, useEffect, useState, useTransition } from "react";
import { useLazyLoadQuery } from "react-relay/hooks";
import { BigNumber } from "ethers";
import { useAccount } from "wagmi";

import { VStack, HStack } from "../../components/VStack";
import * as theme from "../../theme";
import { useOpenDialog } from "../../components/DialogProvider/DialogProvider";
import { makePaginationItems } from "../../hooks/pagination";
import { VoterCard } from "../HomePage/VoterCard";
import { VoteSortSelector } from "../ProposalsListPage/VoteSortSelector";

import { VotesCastPanelFragment$key } from "./__generated__/VotesCastPanelFragment.graphql";
import { CastVoteInput } from "./CastVoteInput";
import { ProposalVotesSummary } from "./ProposalVotesSummary";
import { VoteRow } from "./VoteRow";
import { VotesCastPanelVotesFragment$key } from "./__generated__/VotesCastPanelVotesFragment.graphql";
import { VotesCastPanelHoveredVoterQuery } from "./__generated__/VotesCastPanelHoveredVoterQuery.graphql";
import { VotesCastPanelQueryFragment$key } from "./__generated__/VotesCastPanelQueryFragment.graphql";
import { VotesOrder } from "./__generated__/ProposalsPageDetailQuery.graphql";
import { VotesCastPanelOwnVotesFragment$key } from "./__generated__/VotesCastPanelOwnVotesFragment.graphql";

export function VotesCastPanel({
  fragmentRef,
  queryFragmentRef,
  expanded,
  votesSort,
  setVotesOrder,
}: {
  fragmentRef: VotesCastPanelFragment$key;
  queryFragmentRef: VotesCastPanelQueryFragment$key;
  expanded: boolean;
  votesSort: VotesOrder;
  setVotesOrder: (order: VotesOrder) => void;
}) {
  const queryResult = useFragment(
    graphql`
      fragment VotesCastPanelQueryFragment on Query
      @argumentDefinitions(
        address: { type: "String!" }
        proposalId: { type: "ID!" }
        skipAddress: { type: "Boolean!" }
        orderBy: { type: "VotesOrder!" }
      ) {
        ...VotesCastPanelVotesFragment
          @arguments(proposalId: $proposalId, orderBy: $orderBy)
        ...CastVoteInputQueryFragment
          @arguments(address: $address, skipAddress: $skipAddress)
        ...CastVoteInputVoteButtonsQueryFragment
          @arguments(address: $address, skipAddress: $skipAddress)
        ...VotesCastPanelOwnVotesFragment
          @arguments(address: $address, skipAddress: $skipAddress)
      }
    `,
    queryFragmentRef
  );

  const [isPending, startTransition] = useTransition();

  const [hoveredVoterAddress, setHoveredVoterAddressValue] = useState<
    string | null
  >(null);

  const [reason, setReason] = useState("");
  const [hasVoted, setHasVoted] = useState(false);

  function setHoveredVoterAddress(value: string | null) {
    startTransition(() => setHoveredVoterAddressValue(value));
  }

  // todo: this is a very jank ui
  useEffect(() => {
    const handleClick = () => setHoveredVoterAddress(null);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  });

  const openDialog = useOpenDialog();

  const result = useFragment(
    graphql`
      fragment VotesCastPanelFragment on Proposal {
        number

        ...ProposalVotesSummaryFragment
        ...CastVoteInputFragment
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
          height: 100%;
          padding-bottom: ${theme.spacing["6"]};
          font-size: ${theme.fontSize.xs};
          min-height: 0;
          @media (max-width: ${theme.maxWidth["2xl"]}) {
            gap: 0;
          }
        `}
      >
        <VStack
          gap="4"
          className={cx(
            css`
              min-height: 0;
              flex-shrink: 1;
              padding-left: ${theme.spacing["4"]};
              padding-right: ${theme.spacing["4"]};
              overflow-y: scroll;
            `,
            "mobile-web-scroll-div"
          )}
        >
          <HStack
            justifyContent="space-between"
            alignItems="center"
            className={css`
              flex-shrink: 0;
              padding-top: ${theme.spacing["4"]};
              padding-left: ${theme.spacing["1"]};
              padding-right: ${theme.spacing["1"]};
            `}
          >
            <div
              className={css`
                font-size: ${theme.fontSize.base};
                font-weight: ${theme.fontWeight.semibold};
                line-height: ${theme.lineHeight.normal};
              `}
            >
              Votes
            </div>

            <VoteSortSelector
              value={votesSort}
              onChange={(newSort) =>
                startTransition(() => setVotesOrder(newSort))
              }
              size="m"
            />
          </HStack>
          {hoveredVoterAddress && (
            <div
              className={css`
                position: absolute;
                width: calc(100% - 2 * ${theme.spacing["4"]});
                right: calc(100% + ${theme.spacing["4"]});
                font-size: ${theme.fontSize.base};
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
                <HoveredVoter
                  hoveredVoterAddress={hoveredVoterAddress}
                  contentClassName={css`
                    transition: opacity 0.3s ease-in-out;

                    opacity: ${isPending ? 0.3 : 1};
                  `}
                />
              </Suspense>
            </div>
          )}

          <ProposalVotesSummary
            fragmentRef={result}
            className={css`
              flex-shrink: 0;
            `}
          />

          <VotesCastPanelOwnVotes
            proposalId={result.number}
            fragmentRef={queryResult}
          />

          {!expanded && (
            <VotesCastPanelVotes
              onVoterHovered={(address) => setHoveredVoterAddress(address)}
              fragmentRef={queryResult}
              isPending={isPending}
            />
          )}
        </VStack>

        {!expanded && (
          <CastVoteInput
            queryFragmentRef={queryResult}
            fragmentRef={result}
            delegateFragmentRef={queryResult}
            proposalFragmentRef={result}
            className={css`
              flex-shrink: 0;
              margin-top: ${theme.spacing["4"]};
              margin-left: ${theme.spacing["4"]};
              margin-right: ${theme.spacing["4"]};
            `}
            reason={reason}
            setReason={(value) => setReason(value)}
            hasVoted={hasVoted}
            onVoteClick={(supportType, reason, address) => {
              openDialog({
                type: "CAST_VOTE",
                params: {
                  address,
                  reason,
                  supportType,
                  proposalId: BigNumber.from(result.number).toNumber(),
                  onVoteSuccess: () => {
                    setReason("");
                    setHasVoted(true);
                  },
                },
              });
            }}
          />
        )}
      </VStack>
    </>
  );
}

function VotesCastPanelOwnVotes({
  proposalId,
  fragmentRef,
}: {
  proposalId: string;
  fragmentRef: VotesCastPanelOwnVotesFragment$key;
}) {
  const { delegate } = useFragment(
    graphql`
      fragment VotesCastPanelOwnVotesFragment on Query
      @argumentDefinitions(
        address: { type: "String!" }
        skipAddress: { type: "Boolean!" }
      ) {
        delegate(addressOrEnsName: $address) @skip(if: $skipAddress) {
          votes {
            proposal {
              id
            }
            ...VoteRowFragment
          }
        }
      }
    `,
    fragmentRef
  );

  const ownVotes = delegate?.votes.filter((it) => {
    const idParts = it.proposal.id.split("|");
    const actualId = idParts[idParts.length - 1];
    return actualId === proposalId;
  });

  if (ownVotes) {
    return (
      <>
        {ownVotes.map((it) => (
          <VoteRow isUser={true} fragmentRef={it} onVoterHovered={() => {}} />
        ))}
      </>
    );
  } else {
    return null;
  }
}

function VotesCastPanelVotes({
  onVoterHovered,
  fragmentRef,
  isPending,
}: {
  onVoterHovered: (address: string) => void;
  fragmentRef: VotesCastPanelVotesFragment$key;
  isPending?: boolean;
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
        orderBy: { type: "VotesOrder!" }
      )
      @refetchable(queryName: "VotesCastPanelPaginationQuery") {
        votes(
          proposalId: $proposalId
          orderBy: $orderBy
          first: $first
          after: $after
        ) @connection(key: "VotesCastPanelFragment_votes") {
          edges {
            node {
              executor {
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

  const { address } = useAccount();

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
    <>
      <VStack
        gap="4"
        className={css`
          padding-bottom: ${theme.spacing["2"]};
        `}
      >
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
              if (
                address &&
                address === item.items.node.executor.address.address
              ) {
                return null;
              } else {
                return (
                  <div
                    key={idx}
                    className={css`
                      ${isPending &&
                      css`
                        opacity: 0.2;
                      `}
                    `}
                  >
                    <VoteRow
                      isUser={false}
                      fragmentRef={item.items.node}
                      onVoterHovered={onVoterHovered}
                    />
                  </div>
                );
              }
            }

            case "LOAD_MORE_SENTINEL": {
              return (
                <LoadMoreSentinel
                  key={idx}
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
    </>
  );
}

type HoveredVoterProps = {
  hoveredVoterAddress: string;
  contentClassName: string;
};

function HoveredVoter({
  hoveredVoterAddress,
  contentClassName,
}: HoveredVoterProps) {
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

  return (
    <VoterCard contentClassName={contentClassName} fragmentRef={delegate} />
  );
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

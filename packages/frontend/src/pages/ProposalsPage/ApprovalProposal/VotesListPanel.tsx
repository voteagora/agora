import { css, keyframes } from "@emotion/css";
import { HStack, VStack } from "../../../components/VStack";
import * as theme from "../../../theme";
import { HoveredVoter, LoadMoreSentinel } from "../VotesCastPanel";
import { useAccount } from "wagmi";
import { makePaginationItems } from "../../../hooks/pagination";
import { useFragment, usePaginationFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { VotesListPanelApprovalFragment$key } from "./__generated__/VotesListPanelApprovalFragment.graphql";
import { VotesListPanelQueryFragment$key } from "./__generated__/VotesListPanelQueryFragment.graphql";
import { NounResolvedLink } from "../../../components/NounResolvedLink";
import { TokenAmountDisplay } from "../../../components/TokenAmountDisplay";
import { VotesListPanelSingleVoteFragment$key } from "./__generated__/VotesListPanelSingleVoteFragment.graphql";
import { Suspense, useEffect, useState, useTransition } from "react";

export function VotesListPanel({
  queryFragmentRef,
}: {
  queryFragmentRef: VotesListPanelQueryFragment$key;
}) {
  const queryResult = useFragment(
    graphql`
      fragment VotesListPanelQueryFragment on Query
      @argumentDefinitions(proposalId: { type: "ID!" }) {
        ...VotesListPanelApprovalFragment @arguments(proposalId: $proposalId)
      }
    `,
    queryFragmentRef
  );
  const [isPending, startTransition] = useTransition();

  const [hoveredVoterAddress, setHoveredVoterAddressValue] = useState<
    string | null
  >(null);

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

  return (
    <VStack
      className={css`
        max-height: calc(
          100vh - 437px
        ); //martin, this is kind of a hack, but it achieves the desired result lol, please don't remove this unless there's a better way
        overflow-y: scroll;
        flex-shrink: 1;
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};
        padding-bottom: ${theme.spacing["4"]};
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
      <VotesCastPanelVotes
        onVoterHovered={(address) => setHoveredVoterAddress(address)}
        fragmentRef={queryResult}
      />
    </VStack>
  );
}

function VotesCastPanelVotes({
  onVoterHovered,
  fragmentRef,
}: {
  onVoterHovered: (address: string) => void;
  fragmentRef: VotesListPanelApprovalFragment$key;
}) {
  const {
    data: { votes },
    loadNext,
    hasNext,
    isLoadingNext,
  } = usePaginationFragment(
    graphql`
      fragment VotesListPanelApprovalFragment on Query
      @argumentDefinitions(
        proposalId: { type: "ID!" }
        first: { type: "Int", defaultValue: 30 }
        after: { type: "String" }
      )
      @refetchable(queryName: "VotesListPanelApprovalPaginationQuery") {
        votes(proposalId: $proposalId, first: $first, after: $after)
          @connection(key: "VotesCastPanelFragment_votes") {
          edges {
            node {
              voter {
                address {
                  address
                }
              }

              ...VotesListPanelSingleVoteFragment
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
    <VStack>
      {items.map((item, idx) => {
        switch (item.type) {
          case "LOADING": {
            return (
              <HStack
                justifyContent="center"
                key={idx}
                className={css`
                  color: ${theme.colors.gray["700"]};
                  font-size: ${theme.fontSize.xs};
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
                <SingleVote singleOptionRef={item.items.node} />
              </div>
            );
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
  );
}

function SingleVote({
  singleOptionRef,
}: {
  singleOptionRef: VotesListPanelSingleVoteFragment$key;
}) {
  const { options, reason, votes, voter } = useFragment(
    graphql`
      fragment VotesListPanelSingleVoteFragment on Vote {
        options {
          description
        }
        reason
        votes {
          amount {
            ...TokenAmountDisplayFragment
          }
        }
        voter {
          address {
            address
            resolvedName {
              ...NounResolvedLinkFragment
            }
          }
        }
      }
    `,
    singleOptionRef
  );
  const { address } = useAccount();
  console.log(reason);
  return (
    <VStack
      className={css`
        color: ${theme.colors.black};
        font-weight: ${theme.fontWeight.semibold};
        font-size: ${theme.fontSize.xs};
        margin-bottom: ${theme.spacing["5"]};
        border-radius: ${theme.borderRadius.md};
        border: 1px solid ${theme.colors.gray["eb"]};
      `}
    >
      <HStack
        alignItems="center"
        justifyContent="space-between"
        className={css`
          padding: ${theme.spacing["3"]};
        `}
      >
        <div>
          <NounResolvedLink resolvedName={voter.address.resolvedName} />
          {address === voter.address.address && " (you)"}
          {" vote for"}
        </div>
        <div
          className={css`
            color: ${theme.colors.gray["4f"]};
          `}
        >
          <TokenAmountDisplay fragment={votes.amount} />
        </div>
      </HStack>
      <VStack
        className={css`
          margin-bottom: ${reason ? theme.spacing["1"] : "0"};
          color: ${theme.colors.gray[700]};
          gap: ${theme.spacing["1"]};
          font-weight: ${theme.fontWeight.medium};
          padding: 0 ${theme.spacing["3"]} ${theme.spacing["3"]}
            ${theme.spacing["3"]};
        `}
      >
        {options?.map((option, index) => (
          <p
            className={css`
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
            `}
          >
            {++index}. {option.description}
          </p>
        ))}
        {options?.length === 0 && "Abstain"}
      </VStack>
      {reason && (
        <div>
          <p
            className={css`
              margin-top: ${theme.spacing["1"]};
              color: ${theme.colors.gray[700]};
              font-weight: ${theme.fontWeight.medium};
              white-space: pre-wrap;
              padding: ${theme.spacing["3"]};
              border-top: 1px solid ${theme.colors.gray["300"]};
            `}
          >
            {reason}
          </p>
        </div>
      )}
    </VStack>
  );
}

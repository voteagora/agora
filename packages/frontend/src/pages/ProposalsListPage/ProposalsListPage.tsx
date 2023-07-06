import { css } from "@emotion/css";
import { graphql, usePaginationFragment, usePreloadedQuery } from "react-relay";
import InfiniteScroll from "react-infinite-scroller";
import { useCallback } from "react";
import { useAccount } from "wagmi";

import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { OverviewMetricsContainer } from "../HomePage/OverviewMetricsContainer";
import { PageDivider } from "../../components/PageDivider";
import { RoutePropsForRoute } from "../../components/HammockRouter/HammockRouter";

import { PropHouseAuctionRow } from "./PropHouseAuctionRow";
import { OnChainProposalRow } from "./OnChainProposalRow";
import { proposalsListPageRoute, query } from "./ProposalsListPageRoute";
import { ProposalsListPageProposalsFragment$key } from "./__generated__/ProposalsListPageProposalsFragment.graphql";
import NonVotedProposalsListPage from "./NonVotedProposalsList";

export default function ProposalsListPage({
  initialQueryRef,
}: RoutePropsForRoute<typeof proposalsListPageRoute>) {
  const result = usePreloadedQuery(query, initialQueryRef);

  const { address } = useAccount();

  const {
    data: { proposals },
    loadNext,
    hasNext,
    isLoadingNext,
  } = usePaginationFragment(
    graphql`
      fragment ProposalsListPageProposalsFragment on Query
      @argumentDefinitions(
        first: { type: "Int", defaultValue: 10 }
        after: { type: "String" }
        orderBy: { type: "ProposalOrder", defaultValue: byStartTimeDesc }
      )
      @refetchable(queryName: "ProposalsListPageProposalsPaginationQuery") {
        proposals(after: $after, first: $first, orderBy: $orderBy)
          @connection(key: "ProposalListPage_proposals") {
          edges {
            node {
              __typename

              ... on OnChainProposalType {
                onChainProposal {
                  ...OnChainProposalRowFragment
                }
              }

              ... on PropHouseProposalType {
                propHouseProposal {
                  ...PropHouseAuctionRowFragment
                }
              }
            }
          }
        }
      }
    `,
    result as ProposalsListPageProposalsFragment$key
  );

  const loadMore = useCallback(() => {
    loadNext(30);
  }, [loadNext]);

  return (
    <>
      <VStack
        className={css`
          width: ${theme.maxWidth["6xl"]};
          @media (max-width: ${theme.maxWidth["lg"]}) {
            max-width: 100%;
            display: none;
          }
        `}
      >
        <h1
          className={css`
            font-size: ${theme.fontSize["2xl"]};
            font-weight: ${theme.fontWeight["extrabold"]};
            padding: 0 ${theme.spacing["4"]};
            margin-bottom: ${theme.spacing["4"]};
            @media (max-width: ${theme.maxWidth["lg"]}) {
              margin-bottom: 0px;
            }
          `}
        >
          Proposal metrics
        </h1>
        <OverviewMetricsContainer fragmentRef={result} />
      </VStack>

      <PageDivider />

      <VStack
        className={css`
          margin-top: ${theme.spacing["4"]};
          max-width: ${theme.maxWidth["6xl"]};
          padding: 0 ${theme.spacing["4"]};
        `}
      >
        {address && (
          <NonVotedProposalsListPage
            address={address}
            initialQueryRef={initialQueryRef}
          />
        )}
        <HStack
          justifyContent="space-between"
          className={css`
            margin-top: ${theme.spacing["8"]};
            @media (max-width: ${theme.maxWidth["lg"]}) {
              max-width: 100%;
              flex-direction: column;
              margin-bottom: ${theme.spacing["1"]};
            }
          `}
        >
          <h1
            className={css`
              font-size: ${theme.fontSize["2xl"]};
              font-weight: ${theme.fontWeight["extrabold"]};
              @media (max-width: ${theme.maxWidth["lg"]}) {
                margin-bottom: ${theme.spacing["1"]};
              }
            `}
          >
            Proposals
          </h1>
        </HStack>

        <VStack
          className={css`
            margin: ${theme.spacing["4"]} 0 ${theme.spacing["12"]} 0;
            @media (max-width: ${theme.maxWidth["lg"]}) {
              margin-top: ${theme.spacing["3"]};
            }
            border: 1px solid ${theme.colors.gray[300]};
            border-radius: ${theme.borderRadius["xl"]};
            box-shadow: ${theme.boxShadow["newDefault"]};
            overflow: hidden;
          `}
        >
          <InfiniteScroll loadMore={loadMore} hasMore={hasNext}>
            <table
              className={css`
                table-layout: fixed;
                width: 100%;
                border-collapse: collapse;
                background-color: ${theme.colors.white};
              `}
            >
              <tbody>
                {proposals.edges.map(({ node: proposal }, idx) => {
                  switch (proposal.__typename) {
                    case "OnChainProposalType":
                      return (
                        <OnChainProposalRow
                          key={idx}
                          fragmentRef={proposal.onChainProposal}
                        />
                      );

                    case "PropHouseProposalType":
                      return (
                        <PropHouseAuctionRow
                          key={idx}
                          fragmentRef={proposal.propHouseProposal}
                        />
                      );

                    default:
                      throw new Error(`unknown proposal type`);
                  }
                })}
              </tbody>
            </table>
          </InfiniteScroll>
        </VStack>

        {isLoadingNext && (
          <HStack
            justifyContent="center"
            className={css`
              padding: ${theme.spacing["8"]};
            `}
          >
            Loading...
          </HStack>
        )}
      </VStack>
    </>
  );
}

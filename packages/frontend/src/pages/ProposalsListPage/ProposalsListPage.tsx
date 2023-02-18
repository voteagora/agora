import { css } from "@emotion/css";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import graphql from "babel-plugin-relay/macro";
import { useLazyLoadQuery } from "react-relay/hooks";
import { OverviewMetricsContainer } from "../HomePage/OverviewMetricsContainer";
import { startTransition, useState } from "react";
import { PropHouseAuctionRow } from "./PropHouseAuctionRow";
import { OnChainProposalRow } from "./OnChainProposalRow";
import { PageDivider } from "../../components/PageDivider";
import { ProposalsListPageQuery } from "./__generated__/ProposalsListPageQuery.graphql";
import {
  ProposalStatusFilter,
  ProposalStatusSelector,
} from "./ProposalStatusSelector";
import { ProposalSortSelector, ProposalSortType } from "./ProposalSortSelector";
import { useProposals } from "./useProposals";
import {
  ProposalTypeFilter,
  ProposalTypeSelector,
} from "./ProposalTypeSelector";

export function ProposalsListPage() {
  const result = useLazyLoadQuery<ProposalsListPageQuery>(
    graphql`
      query ProposalsListPageQuery {
        proposals(first: 1000, orderDirection: desc, orderBy: createdBlock) {
          id
          number
          actualStatus
          createdTimestamp

          ...OnChainProposalRowFragment
        }

        propHouseAuctions {
          startTime
          status

          ...PropHouseAuctionRowFragment
        }

        ...OverviewMetricsContainer
      }
    `,
    {}
  );

  const [sort, setSort] = useState<ProposalSortType>("NEWEST");
  const [filter, setFilter] = useState<ProposalStatusFilter>("ALL");
  const [filterProposalType, setFilterProposalType] =
    useState<ProposalTypeFilter>("ALL");

  const proposals = useProposals(result, sort, filterProposalType, filter);

  return (
    <>
      <VStack
        className={css`
          width: ${theme.maxWidth["6xl"]};
          @media (max-width: ${theme.maxWidth["lg"]}) {
            max-width: 100%;
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
          max-width: ${theme.maxWidth["6xl"]};
          padding: 0 ${theme.spacing["4"]};
        `}
      >
        <HStack
          justifyContent="space-between"
          className={css`
            margin-top: ${theme.spacing["16"]};
            margin-bottom: ${theme.spacing["4"]};
            @media (max-width: ${theme.maxWidth["lg"]}) {
              max-width: 100%;
            }
          `}
        >
          <h1
            className={css`
              font-size: ${theme.fontSize["2xl"]};
              font-weight: ${theme.fontWeight["extrabold"]};
            `}
          >
            All Proposals
          </h1>
          <HStack gap="4">
            <ProposalTypeSelector
              value={filterProposalType}
              onChange={(newFilterType) =>
                startTransition(() => setFilterProposalType(newFilterType))
              }
              size="l"
            />

            <ProposalStatusSelector
              value={filter}
              onChange={(newFilter) => {
                startTransition(() => setFilter(newFilter));
              }}
              size="l"
            />

            <ProposalSortSelector
              value={sort}
              onChange={(newSort) => startTransition(() => setSort(newSort))}
              size="l"
            />
          </HStack>
        </HStack>

        <VStack
          className={css`
            margin: ${theme.spacing["4"]} 0 ${theme.spacing["12"]} 0;
            border: 1px solid ${theme.colors.gray[300]};
            border-radius: ${theme.borderRadius["xl"]};
            box-shadow: ${theme.boxShadow["newDefault"]};
            overflow: hidden;
          `}
        >
          <table
            className={css`
              table-layout: fixed;
              width: 100%;
              border-collapse: collapse;
              background-color: ${theme.colors.white};
            `}
          >
            <tbody>
              {proposals.map((proposal, idx) => {
                switch (proposal.type) {
                  case "PROP_HOUSE_AUCTION":
                    return (
                      <PropHouseAuctionRow
                        key={idx}
                        fragmentRef={proposal.auction}
                      />
                    );

                  case "ON_CHAIN":
                    return (
                      <OnChainProposalRow
                        key={idx}
                        fragmentRef={proposal.proposal}
                      />
                    );

                  default:
                    throw new Error(`unknown proposal type`);
                }
              })}
            </tbody>
          </table>
        </VStack>
      </VStack>
    </>
  );
}

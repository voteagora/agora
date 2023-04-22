import { css } from "@emotion/css";
import graphql from "babel-plugin-relay/macro";
import { startTransition, useState } from "react";
import { useLazyLoadQuery } from "react-relay/hooks";

import { PageDivider } from "../../components/PageDivider";
import { HStack, VStack } from "../../components/VStack";
import * as theme from "../../theme";
import { OverviewMetricsContainer } from "../HomePage/OverviewMetricsContainer";

import { OnChainProposalRow } from "./OnChainProposalRow";
import { PropHouseAuctionRow } from "./PropHouseAuctionRow";
import { ProposalSortSelector, ProposalSortType } from "./ProposalSortSelector";
import {
  ProposalStatusFilter,
  ProposalStatusSelector,
} from "./ProposalStatusSelector";
import {
  ProposalTypeFilter,
  ProposalTypeSelector,
} from "./ProposalTypeSelector";
import { ProposalsListPageQuery } from "./__generated__/ProposalsListPageQuery.graphql";
import { useProposals } from "./useProposals";

export function ProposalsListPage() {
  const result = useLazyLoadQuery<ProposalsListPageQuery>(
    graphql`
      query ProposalsListPageQuery {
        proposals {
          # eslint-disable-next-line relay/unused-fields
          status
          # eslint-disable-next-line relay/unused-fields
          voteStartsAt

          ...OnChainProposalRowFragment
        }

        propHouseAuctions {
          # eslint-disable-next-line relay/unused-fields
          startTime
          # eslint-disable-next-line relay/unused-fields
          status

          ...PropHouseAuctionRowFragment
        }

        ...OverviewMetricsContainerFragment
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

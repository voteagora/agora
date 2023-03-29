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
import NounsPics from "./NounsPics.png";
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
        <a
          href="https://prop.house/noun-40/noun-40-looking-for-prop-house-delegate"
          target="_blank"
          rel="noreferrer"
        >
          <HStack
            justifyContent="space-between"
            className={css`
              background-color: ${theme.colors.white};
              border-radius: ${theme.borderRadius["xl"]};
              box-shadow: ${theme.boxShadow["newDefault"]};
              margin: 0 ${theme.spacing["4"]};
              border: 1px solid ${theme.colors.gray["300"]};
              margin-bottom: ${theme.spacing["8"]};
              padding: ${theme.spacing["8"]};
              transition: transform 0.2s ease-in-out,
                box-shadow 0.2s ease-in-out;
              :hover {
                transform: scale(1.005);
                transform: translateY(-1px);
                box-shadow: ${theme.boxShadow["md"]};
              }
              @media (max-width: ${theme.maxWidth.lg}) {
                flex-direction: column;
              }
            `}
          >
            <VStack
              justifyContent="center"
              className={css`
                max-width: ${theme.maxWidth["lg"]};
              `}
            >
              <div
                className={css`
                  font-size: ${theme.fontSize.sm};
                  color: ${theme.colors.teal["600"]};
                  font-weight: ${theme.fontWeight["medium"]};
                `}
              >
                Submit your profile to
              </div>
              <div
                className={css`
                  font-size: ${theme.fontSize["2xl"]};
                  font-weight: ${theme.fontWeight["extrabold"]};
                `}
              >
                Be the delegate for 22 nouns on Prop House
              </div>
              <div
                className={css`
                  color: ${theme.colors.gray["700"]};
                `}
              >
                Noun 40 is looking for a Prop-House-only delegate for 22 nouns
                currently represented by vote.noun40.eth. Will you be the one?
              </div>
            </VStack>
            <img
              src={NounsPics}
              alt="Noun 40's nouns"
              className={css`
                max-height: ${theme.spacing["32"]};
                @media (max-width: ${theme.maxWidth.lg}) {
                  margin-top: ${theme.spacing["4"]};
                }
              `}
            />
          </HStack>
        </a>
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

import { css } from "@emotion/css";
import { graphql, usePaginationFragment } from "react-relay";
import { motion } from "framer-motion";
import { useCallback, useTransition } from "react";
import InfiniteScroll from "react-infinite-scroller";

import { icons } from "../../../icons/icons";
import { HStack, VStack } from "../../../components/VStack";
import * as theme from "../../../theme";
import { colorForPropHouseAuctionStatus } from "../../ProposalsListPage/PropHouseAuctionRow";

import { OnChainProposalRow } from "./OnChainProposalRow";
import { ProposalRow } from "./ProposalRow";
import { ProposalsListPanelProposalsFragment$key } from "./__generated__/ProposalsListPanelProposalsFragment.graphql";

export type SelectedProposal = {
  type: "ON_CHAIN" | "PROP_HOUSE_AUCTION";
  identifier: string;
};

type Props = {
  fragmentRef: ProposalsListPanelProposalsFragment$key;
  selectedProposal: SelectedProposal;
  onProposalSelected: (nextSelectedProposal: SelectedProposal) => void;
  expanded: boolean;
  toggleExpanded: () => void;
};

export function ProposalsListPanel({
  fragmentRef,
  selectedProposal,
  onProposalSelected,
  toggleExpanded,
  expanded,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const {
    data: { proposals },
    loadNext,
    hasNext,
    isLoadingNext,
  } = usePaginationFragment(
    graphql`
      fragment ProposalsListPanelProposalsFragment on Query
      @argumentDefinitions(
        first: { type: "Int", defaultValue: 50 }
        after: { type: "String" }
        orderBy: { type: "ProposalOrder", defaultValue: byStartTimeDesc }
      )
      @refetchable(queryName: "ProposalsListPanelProposalsPaginationQuery") {
        proposals(after: $after, first: $first, orderBy: $orderBy)
          @connection(key: "ProposalListPage_proposals") {
          edges {
            node {
              __typename

              ... on OnChainProposalType {
                onChainProposal {
                  number
                  ...OnChainProposalRowListFragment
                }
              }

              ... on PropHouseProposalType {
                propHouseProposal {
                  number
                  title
                  status
                }
              }
            }
          }
        }
      }
    `,
    fragmentRef
  );

  const loadMore = useCallback(() => {
    loadNext(30);
  }, [loadNext]);

  return (
    <motion.div
      className={css`
        display: flex;
        flex-direction: column;

        @media (max-width: ${theme.maxWidth["2xl"]}) {
          display: none;
        }
      `}
      initial={{ opacity: 1 }}
      animate={{ opacity: isPending ? 0.3 : 1 }}
      transition={{ duration: 0.3, delay: isPending ? 0.3 : 0 }}
    >
      <VStack
        gap="4"
        className={css`
          border-bottom: 1px solid ${theme.colors.gray.eb};

          // todo: put this closer to position: absolute below
          position: relative;

          min-height: 0;
          height: 100%;
        `}
      >
        <HStack
          justifyContent="space-between"
          alignItems="center"
          className={css`
            flex-shrink: 0;
            padding-top: ${theme.spacing["4"]};
            padding-left: ${theme.spacing["4"]};
            padding-right: ${theme.spacing["4"]};
          `}
        >
          <div
            className={css`
              font-size: ${theme.fontSize.base};
              font-weight: ${theme.fontWeight.semibold};
              line-height: ${theme.lineHeight.normal};
            `}
          >
            Proposals
          </div>
        </HStack>

        <VStack
          className={css`
            height: calc(
              100vh - 317px
            ); //martin, this is kind of a hack, but it achieves the desired result lol, please don't remove this unless there's a better way
            overflow-y: scroll;
            flex-shrink: 1;
            padding-left: ${theme.spacing["4"]};
            padding-right: ${theme.spacing["4"]};
            padding-bottom: ${theme.spacing["4"]};
          `}
        >
          <InfiniteScroll loadMore={loadMore} hasMore={hasNext}>
            <VStack
              className={css`
                ::-webkit-scrollbar {
                  display: none;
                }
                flex-shrink: 1;
                padding-left: ${theme.spacing["4"]};
                padding-right: ${theme.spacing["4"]};
                padding-bottom: ${theme.spacing["4"]};
              `}
            >
              {proposals.edges.map(({ node: proposal }, idx) => {
                switch (proposal.__typename) {
                  case "OnChainProposalType": {
                    return (
                      <OnChainProposalRow
                        key={idx}
                        fragmentRef={proposal.onChainProposal}
                        selected={
                          selectedProposal.type === "ON_CHAIN" &&
                          selectedProposal.identifier ===
                            proposal.onChainProposal.number.toString()
                        }
                        onClick={() =>
                          onProposalSelected({
                            type: "ON_CHAIN",
                            identifier:
                              proposal.onChainProposal.number.toString(),
                          })
                        }
                      />
                    );
                  }

                  case "PropHouseProposalType": {
                    return (
                      <ProposalRow
                        key={idx}
                        selected={
                          selectedProposal.type === "PROP_HOUSE_AUCTION" &&
                          selectedProposal.identifier ===
                            proposal.propHouseProposal.number.toString()
                        }
                        onClick={() =>
                          onProposalSelected({
                            type: "PROP_HOUSE_AUCTION",
                            identifier:
                              proposal.propHouseProposal.number.toString(),
                          })
                        }
                        typeTitle={"Prop house round"}
                        title={proposal.propHouseProposal.title}
                        status={proposal.propHouseProposal.status}
                        statusColor={colorForPropHouseAuctionStatus(
                          proposal.propHouseProposal.status
                        )}
                      />
                    );
                  }

                  default: {
                    throw new Error("unknown error");
                  }
                }
              })}
            </VStack>
          </InfiniteScroll>
        </VStack>

        <button
          onClick={() => toggleExpanded()}
          className={css`
            flex-shrink: 0;
            border: 1px solid ${theme.colors.gray.eb};
            width: 40px;
            height: 40px;
            border-radius: ${theme.borderRadius.full};
            background-color: ${theme.colors.white};
            position: absolute;
            left: calc(50% - 20px);
            bottom: -20px;
            transition: 200ms all;
            :hover {
              box-shadow: ${theme.boxShadow.newDefault};
            }
          `}
        >
          <HStack justifyContent="center">
            <img
              className={css`
                opacity: 60%;
                transition: 200ms all;
                :hover {
                  opacity: 100%;
                }
              `}
              src={icons.expand}
              alt="expand"
            />
          </HStack>
        </button>
      </VStack>
    </motion.div>
  );
}

export function selectedProposalToPath(proposal: SelectedProposal) {
  switch (proposal.type) {
    case "ON_CHAIN":
      return `/proposals/${proposal.identifier}`;

    case "PROP_HOUSE_AUCTION":
      return `/auctions/${proposal.identifier}`;
  }
}

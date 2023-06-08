import { css } from "@emotion/css";
import { graphql, useFragment } from "react-relay";
import { motion } from "framer-motion";
import { useState, useTransition } from "react";

import { icons } from "../../../icons/icons";
import { HStack, VStack } from "../../../components/VStack";
import * as theme from "../../../theme";
import {
  ProposalStatusFilter,
  ProposalStatusSelector,
} from "../../ProposalsListPage/ProposalStatusSelector";
import {
  ProposalTypeFilter,
  ProposalTypeSelector,
} from "../../ProposalsListPage/ProposalTypeSelector";
import {
  ProposalSortSelector,
  ProposalSortType,
} from "../../ProposalsListPage/ProposalSortSelector";
import { useProposals } from "../../ProposalsListPage/useProposals";
import { colorForPropHouseAuctionStatus } from "../../ProposalsListPage/PropHouseAuctionRow";

import { OnChainProposalRow } from "./OnChainProposalRow";
import { ProposalRow } from "./ProposalRow";
import { ProposalsListPanelFragment$key } from "./__generated__/ProposalsListPanelFragment.graphql";

export type SelectedProposal = {
  type: "ON_CHAIN" | "PROP_HOUSE_AUCTION";
  identifier: string;
};

type Props = {
  fragmentRef: ProposalsListPanelFragment$key;
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

  const result = useFragment(
    graphql`
      fragment ProposalsListPanelFragment on Query {
        # eslint-disable-next-line relay/unused-fields
        proposals {
          id
          number
          status
          voteStartsAt

          ...OnChainProposalRowListFragment
        }
        # eslint-disable-next-line relay/unused-fields
        propHouseAuctions {
          startTime
          status

          number
          title
          proposalEndTime
          votingEndTime
        }
      }
    `,
    fragmentRef
  );

  const [sort, setSort] = useState<ProposalSortType>("NEWEST");
  const [filter, setFilter] = useState<ProposalStatusFilter>("ALL");
  const [filterProposalType, setFilterProposalType] =
    useState<ProposalTypeFilter>("ALL");

  const proposals = useProposals(result, sort, filterProposalType, filter);

  const filteredProposals = proposals.filter((it) => {
    if (expanded) {
      return true;
    }

    switch (selectedProposal.type) {
      case "ON_CHAIN":
        return (
          it.type === "ON_CHAIN" &&
          it.proposal.number.toString() === selectedProposal.identifier
        );

      case "PROP_HOUSE_AUCTION":
        return (
          it.type === "PROP_HOUSE_AUCTION" &&
          it.auction.number.toString() === selectedProposal.identifier
        );

      default:
        throw new Error("unexpected");
    }
  });

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

          <HStack gap="3">
            <ProposalTypeSelector
              value={filterProposalType}
              onChange={(newFilterType) =>
                startTransition(() => setFilterProposalType(newFilterType))
              }
              size="m"
            />

            <ProposalStatusSelector
              value={filter}
              onChange={(newFilter) =>
                startTransition(() => setFilter(newFilter))
              }
              size="m"
            />

            <ProposalSortSelector
              value={sort}
              onChange={(newSort) => startTransition(() => setSort(newSort))}
              size="m"
            />
          </HStack>
        </HStack>

        <VStack
          className={css`
            max-height: calc(
              100vh - 317px
            ); //martin, this is kind of a hack, but it achieves the desired result lol, please don't remove this unless there's a better way
            overflow-y: scroll;
            flex-shrink: 1;
            padding-left: ${theme.spacing["4"]};
            padding-right: ${theme.spacing["4"]};
            padding-bottom: ${theme.spacing["4"]};
          `}
        >
          {filteredProposals.map((proposal, idx) => {
            switch (proposal.type) {
              case "ON_CHAIN": {
                return (
                  <OnChainProposalRow
                    key={idx}
                    fragmentRef={proposal.proposal}
                    selected={
                      selectedProposal.type === "ON_CHAIN" &&
                      selectedProposal.identifier ===
                        proposal.proposal.number.toString()
                    }
                    onClick={() =>
                      onProposalSelected({
                        type: "ON_CHAIN",
                        identifier: proposal.proposal.number.toString(),
                      })
                    }
                  />
                );
              }

              case "PROP_HOUSE_AUCTION": {
                return (
                  <ProposalRow
                    key={idx}
                    selected={
                      selectedProposal.type === "PROP_HOUSE_AUCTION" &&
                      selectedProposal.identifier ===
                        proposal.auction.number.toString()
                    }
                    onClick={() =>
                      onProposalSelected({
                        type: "PROP_HOUSE_AUCTION",
                        identifier: proposal.auction.number.toString(),
                      })
                    }
                    typeTitle={"Prop house round"}
                    title={proposal.auction.title}
                    status={proposal.auction.status}
                    statusColor={colorForPropHouseAuctionStatus(
                      proposal.auction.status
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

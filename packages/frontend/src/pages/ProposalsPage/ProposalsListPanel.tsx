import { css } from "@emotion/css";
import { icons } from "../../icons/icons";
import graphql from "babel-plugin-relay/macro";
import { utils } from "ethers";
import { motion } from "framer-motion";
import { useMemo, useState, useTransition } from "react";
import { useFragment } from "react-relay";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { HStack, VStack } from "../../components/VStack";
import * as theme from "../../theme";
import { colorForSupportType } from "../DelegatePage/VoteDetailsContainer";
import { Selector } from "../HomePage/Selector";
import { ProposalsListPanelFragment$key } from "./__generated__/ProposalsListPanelFragment.graphql";
import {
  ProposalsListPanelStatusFragment$key,
  ActualProposalStatus,
} from "./__generated__/ProposalsListPanelStatusFragment.graphql";
import { ProposalsListPanelSingleProposalFragment$key } from "./__generated__/ProposalsListPanelSingleProposalFragment.graphql";

export type Filter =
  | "ALL"
  | "ACTIVE"
  | "EXECUTED"
  | "PENDING"
  | "CANCELLED"
  | "VETOED"
  | "QUEUED";
export type Sort = "desc" | "asc";

export function ProposalsListPanel({
  fragmentRef,
  selectedProposalId,
  setSelectedProposalID,
  toggleExpanded,
  expanded,
}: {
  expanded: boolean;
  selectedProposalId: number | null;
  fragmentRef: ProposalsListPanelFragment$key;
  setSelectedProposalID: (nextProposalID: number) => void;
  toggleExpanded: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("desc");
  const [isPending, startTransition] = useTransition();

  const result = useFragment(
    graphql`
      fragment ProposalsListPanelFragment on Query {
        proposals(orderBy: createdBlock, orderDirection: desc, first: 1000) {
          number
          actualStatus

          ...ProposalsListPanelSingleProposalFragment
        }
      }
    `,
    fragmentRef
  );

  const displayedProposals = useMemo(() => {
    if (!expanded) {
      return result.proposals.filter(
        (proposal) => proposal.number === selectedProposalId
      );
    }

    return result.proposals.filter(
      (proposal) => filter === "ALL" || proposal.actualStatus === filter
    );
  }, [expanded, filter, result.proposals, selectedProposalId]);

  const sortedProposals = useMemo(() => {
    switch (sort) {
      case "desc":
        return displayedProposals;

      case "asc":
        return displayedProposals.slice().reverse();
    }
  }, [displayedProposals, sort]);

  return (
    <motion.div
      className={css`
        display: flex;
        flex-direction: column;
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
            <Selector
              items={[
                {
                  title: "All",
                  value: "ALL" as const,
                },
                {
                  title: "Active",
                  value: "ACTIVE" as const,
                },
                {
                  title: "Pending",
                  value: "PENDING" as const,
                },
                {
                  title: "Cancelled",
                  value: "CANCELLED" as const,
                },
                {
                  title: "Executed",
                  value: "EXECUTED" as const,
                },
                {
                  title: "Defeated",
                  value: "VETOED" as const,
                },
                {
                  title: "Queued",
                  value: "QUEUED" as const,
                },
              ]}
              value={filter}
              onChange={(newFilter) =>
                startTransition(() => setFilter(newFilter))
              }
              size={"m"}
            />
            <Selector
              items={[
                {
                  title: "Newest",
                  value: "desc" as const,
                },
                {
                  title: "Oldest",
                  value: "asc" as const,
                },
              ]}
              value={sort}
              onChange={(newSort) => startTransition(() => setSort(newSort))}
              size={"m"}
            />
          </HStack>
        </HStack>

        <VStack
          className={css`
            max-height: calc(100vh - 317px); //martin, this is kind of a hack, but it achieves the desired result lol, please don't remove this unless there's a better way
            overflow-y: scroll;
            flex-shrink: 1;
            padding-left: ${theme.spacing["4"]};
            padding-right: ${theme.spacing["4"]};
            padding-bottom: ${theme.spacing["4"]};
          `}
        >
          {sortedProposals.map((proposal) => (
            <SingleProposal
              selected={proposal.number === selectedProposalId}
              key={proposal.number}
              fragmentRef={proposal}
              onClick={() => {
                setSelectedProposalID(proposal.number);
              }}
            />
          ))}
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

function SingleProposal({
  fragmentRef,
  selected,
  onClick,
}: {
  fragmentRef: ProposalsListPanelSingleProposalFragment$key;
  selected: boolean;
  onClick: () => void;
}) {
  const proposal = useFragment(
    graphql`
      fragment ProposalsListPanelSingleProposalFragment on Proposal {
        number
        actualStatus
        title
        totalValue
        proposer {
          resolvedName {
            ...NounResolvedLinkFragment
          }
        }
        ...ProposalsListPanelStatusFragment
      }
    `,
    fragmentRef
  );

  return (
    <div onClick={onClick}>
      <VStack
        key={proposal.number}
        gap="2"
        className={css`
          cursor: pointer;
          transition:200ms all;
          border-radius: ${theme.borderRadius.lg};
          ${selected &&
          css`
            background-color: ${theme.colors.gray.fa};
          `};
          padding-top: ${theme.spacing["4"]};
          padding-bottom: ${theme.spacing["4"]};
          padding-left: ${theme.spacing["3"]};
          padding-right: ${theme.spacing["3"]};

          &:hover {
            background-color: ${theme.colors.gray.fa};
          }
        `}
      >
        <div
          className={css`
            color: ${theme.colors.gray["4f"]};
            font-weight: ${theme.fontWeight.medium};
            font-size: ${theme.fontSize.xs};
            line-height: ${theme.lineHeight.none};
          `}
        >
          Prop {proposal.number} for {utils.formatEther(proposal.totalValue)}{" "}
          ETH
        </div>
        <div
          className={css`
            color: ${theme.colors.black};
            font-size: ${theme.fontSize.sm};
            font-weight: ${theme.fontWeight.medium};
            line-height: ${theme.lineHeight["5"]};
            cursor: pointer;
          `}
        >
          {proposal.title}
        </div>
        <HStack
          className={css`
            font-weight: ${theme.fontWeight.medium};
            font-size: ${theme.fontSize.xs};
            line-height: ${theme.lineHeight.none};
          `}
        >
          <div
            className={css`
              color: ${theme.colors.gray["4f"]};
            `}
          >
            by{" "}
            <NounResolvedLink resolvedName={proposal.proposer.resolvedName!} />
          </div>
          <div
            className={css`
              color: ${theme.colors.gray.af};
            `}
          >
            &nbsp;•&nbsp;
          </div>
          <ProposalStatusPane fragmentRef={proposal} />
        </HStack>
      </VStack>
    </div>
  );
}

function ProposalStatusPane({
  fragmentRef,
}: {
  fragmentRef: ProposalsListPanelStatusFragment$key;
}) {
  const result = useFragment(
    graphql`
      fragment ProposalsListPanelStatusFragment on Proposal {
        actualStatus
      }
    `,
    fragmentRef
  );

  return (
    <div
      className={css`
        color: ${colorForProposalStatus(result.actualStatus)};
        text-transform: capitalize;
      `}
    >
      {result.actualStatus.toLowerCase()}
    </div>
  );
}

function colorForProposalStatus(status: ActualProposalStatus) {
  switch (status) {
    case "ACTIVE":
      return colorForSupportType("FOR");

    case "EXECUTED":
      return theme.colors.blue["800"];

    case "PENDING":
    case "QUEUED":
    case "EXPIRED":
      return colorForSupportType("ABSTAIN");

    case "DEFEATED":
    case "CANCELLED":
    case "VETOED":
      return colorForSupportType("AGAINST");

    default:
      throw new Error(`Unknown proposal status ${status}`);
  }
}

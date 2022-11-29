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
import {
  ProposalsListPanelFragment$key,
  ProposalsListPanelFragment$data,
} from "./__generated__/ProposalsListPanelFragment.graphql";
import {
  ProposalsListPanelStatusFragment$key,
  ProposalStatus,
} from "./__generated__/ProposalsListPanelStatusFragment.graphql";

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
  setSelectedProposalID,
  expanded,
  setExpanded,
}: {
  fragmentRef: ProposalsListPanelFragment$key;
  setSelectedProposalID: (nextProposalID: number) => void;
  expanded: boolean;
  setExpanded: (nextExpanded: boolean) => void;
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("desc");
  const [proposalListIsPending, updateProposalList] = useTransition();

  // TODO: What if there are more proposals?
  const result = useFragment(
    graphql`
      fragment ProposalsListPanelFragment on Query
      @argumentDefinitions(proposalID: { type: "ID!" }) {
        proposals(orderBy: createdBlock, orderDirection: desc, first: 1000) {
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
        proposal(id: $proposalID) {
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
      }
    `,
    fragmentRef
  );

  const proposalToDisplay = result.proposal!;

  let proposalsToDisplay = useMemo(() => {
    const remainingProposals = result.proposals.filter(
      (proposal) =>
        proposal.number != proposalToDisplay.number &&
        (filter == "ALL" || proposal.actualStatus == filter)
    );
    if (sort == "asc") {
      remainingProposals.reverse();
    }
    return [proposalToDisplay, ...remainingProposals];
  }, [fragmentRef, filter, sort]);
  if (!expanded) {
    proposalsToDisplay = proposalsToDisplay.slice(0, 1);
  }
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: proposalListIsPending ? 0.3 : 1 }}
      transition={{ duration: 0.3, delay: proposalListIsPending ? 0.3 : 0 }}
    >
      <VStack
        gap="4"
        className={css`
          border-bottom: 1px solid ${theme.colors.gray.eb};
          padding: ${theme.spacing["4"]};
          position: relative;
        `}
      >
        <HStack justifyContent="space-between" alignItems="center">
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
                updateProposalList(() => setFilter(newFilter))
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
              onChange={(newSort) => updateProposalList(() => setSort(newSort))}
              size={"m"}
            />
          </HStack>
        </HStack>
        <VStack
          gap="0"
          className={css`
            overflow-y: auto;
            max-height: calc(100vh - 324px);
          `}
        >
          {proposalsToDisplay.map((proposal) => (
            <SingleProposal
              proposal={proposal}
              selected={proposal.number == proposalToDisplay.number}
              onClick={() => {
                setExpanded(false);
                setSelectedProposalID(proposal.number);
              }}
            />
          ))}
        </VStack>
        <button
          onClick={() => setExpanded(!expanded)}
          className={css`
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
  proposal,
  selected,
  onClick,
}: {
  proposal: ProposalsListPanelFragment$data["proposals"][0];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick}>
      <VStack
        key={proposal.number}
        gap="2"
        className={css`
          border-radius: ${theme.borderRadius.lg};
          ${selected && `background-color: ${theme.colors.gray.fa}`};
          padding-top: ${theme.spacing["4"]};
          padding-bottom: ${theme.spacing["4"]};
          padding-left: ${theme.spacing["3"]};
          padding-right: ${theme.spacing["3"]};
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
            by&nbsp;
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

function colorForProposalStatus(status: ProposalStatus) {
  switch (status) {
    case "ACTIVE":
      return colorForSupportType("FOR");
    case "EXECUTED":
      return theme.colors.blue["800"];
    // TODO: Decide what pending color should be. This is when a proposal
    //       has yet to start voting period
    case "PENDING":
    case "QUEUED":
      return colorForSupportType("ABSTAIN");
    case "CANCELLED":
    case "VETOED":
      return colorForSupportType("AGAINST");
    default:
      throw new Error(`Unknown proposal status ${status}`);
  }
}

import { css } from "@emotion/css";
import { graphql, useFragment } from "react-relay";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { BigNumber } from "ethers";

import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { Markdown } from "../../components/Markdown";
import { Selector } from "../HomePage/Selector";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { compareBy, flipComparator } from "../../utils/sorting";
import { icons } from "../../icons/icons";

import { AuctionDetailPanelFragment$key } from "./__generated__/AuctionDetailPanelFragment.graphql";
import { AuctionDetailPanelAuctionProposalFragment$key } from "./__generated__/AuctionDetailPanelAuctionProposalFragment.graphql";
import { usePendingVotes, useUpdatePendingVotes } from "./PendingVotesContext";

type Sort = "MOST VOTES" | "LEAST VOTES" | "NEWEST" | "OLDEST";

export function AuctionDetailPanel({
  fragmentRef,
}: {
  fragmentRef: AuctionDetailPanelFragment$key;
}) {
  const auction = useFragment(
    graphql`
      fragment AuctionDetailPanelFragment on PropHouseAuction {
        title
        description
        status

        proposals {
          number
          voteCount
          createdDate

          ...AuctionDetailPanelAuctionProposalFragment
        }
      }
    `,
    fragmentRef
  );

  const [sort, setSort] = useState<Sort>("MOST VOTES");

  const proposals = auction.proposals.slice().sort(
    (() => {
      switch (sort) {
        case "LEAST VOTES":
          return compareBy((it) => it.voteCount);

        case "MOST VOTES":
          return flipComparator(compareBy((it) => it.voteCount));

        case "OLDEST":
          return compareBy((it) => new Date(it.createdDate).valueOf());

        case "NEWEST":
          return flipComparator(
            compareBy((it) => new Date(it.createdDate).valueOf())
          );
      }
    })()
  );

  const votingEnabled = auction.status === "ACTIVE";

  return (
    <>
      <VStack gap="5">
        <h2
          className={css`
            font-size: ${theme.fontSize["2xl"]};
            font-weight: ${theme.fontWeight.black};
          `}
        >
          {auction.title}
        </h2>

        <Markdown markdown={auction.description} />

        <HStack justifyContent="space-between" alignItems="center">
          <HStack
            gap="2"
            alignItems="center"
            className={css`
              font-weight: ${theme.fontWeight.semibold};
            `}
          >
            <div
              className={css`
                font-size: 16px;
                line-height: 24px;
                color: ${theme.colors.black};
              `}
            >
              Proposals in this round
            </div>
            <div
              className={css`
                width: 32px;
                background: #fafafa;
                color: #4f4f4f;
                border-radius: ${theme.spacing["3"]};
                padding: 2px 8px;
                font-size: 12px;
              `}
            >
              {proposals.length}
            </div>
          </HStack>
          <Selector
            items={[
              {
                title: "Most votes",
                value: "MOST VOTES" as const,
              },
              {
                title: "Least votes",
                value: "LEAST VOTES" as const,
              },
              {
                title: "Newest",
                value: "NEWEST" as const,
              },
              {
                title: "Oldest",
                value: "OLDEST" as const,
              },
            ]}
            value={sort}
            onChange={setSort}
            size={"m"}
          />
        </HStack>
        <VStack gap="4">
          {proposals.map((proposal, idx) => (
            <AuctionProposal
              key={idx}
              fragmentRef={proposal}
              votingEnabled={votingEnabled}
            />
          ))}
        </VStack>
      </VStack>
    </>
  );
}

function AuctionProposal({
  fragmentRef,
  votingEnabled,
}: {
  fragmentRef: AuctionDetailPanelAuctionProposalFragment$key;
  votingEnabled: boolean;
}) {
  const proposal = useFragment(
    graphql`
      fragment AuctionDetailPanelAuctionProposalFragment on PropHouseProposal {
        number
        title
        tldr
        voteCount
        createdDate
        proposer {
          resolvedName {
            ...NounResolvedLinkFragment
          }
        }
      }
    `,
    fragmentRef
  );

  const pendingVotes = usePendingVotes();
  const updatePendingVotes = useUpdatePendingVotes();

  return (
    <VStack
      gap="0"
      className={css`
        border: 1px solid ${theme.colors.gray.eb};
        border-radius: ${theme.borderRadius.xl};
        background: ${theme.colors.white};
        box-shadow: ${theme.boxShadow.newDefault};
      `}
    >
      <VStack
        gap="2"
        className={css`
          padding: ${theme.spacing["5"]} ${theme.spacing["6"]}
            ${theme.spacing["4"]} ${theme.spacing["6"]};
        `}
      >
        <div
          className={css`
            font-weight: ${theme.fontWeight.semibold};
          `}
        >
          {proposal.title}
        </div>
        <div
          className={css`
            font-weight: ${theme.fontWeight.medium};
            font-size: ${theme.fontSize.xs};
            color: ${theme.colors.gray["4f"]};
          `}
        >
          {proposal.tldr}
        </div>
      </VStack>

      <div
        className={css`
          border-top: 1px solid ${theme.colors.gray.eb};
        `}
      />

      <HStack
        gap="4"
        justifyContent="space-between"
        className={css`
          font-weight: ${theme.fontWeight.semibold};
          color: ${theme.colors.gray["4f"]};
          font-size: ${theme.fontSize.xs};
          line-height: ${theme.lineHeight.none};
          padding: ${theme.spacing["2"]} ${theme.spacing["6"]}
            ${theme.spacing["3"]} ${theme.spacing["6"]};
          white-space: nowrap;
        `}
      >
        <HStack alignItems="center">
          <NounResolvedLink resolvedName={proposal.proposer.resolvedName} /> •{" "}
          {formatDistanceToNow(new Date(proposal.createdDate))} ago
        </HStack>

        {votingEnabled && (
          <HStack gap="1" alignItems="center">
            {proposal.voteCount} +&nbsp;
            <input
              placeholder={"0"}
              value={pendingVotes.get(proposal.number) ?? 0}
              type="number"
              min="0"
              onChange={(event) =>
                updatePendingVotes(
                  (oldValue) =>
                    new Map([
                      ...Array.from(oldValue.entries()),
                      [
                        proposal.number,
                        BigNumber.from(event.target.value || "0").toNumber(),
                      ],
                    ])
                )
              }
              className={css`
                width: ${theme.spacing["12"]};
                height: ${theme.spacing["6"]};
                -webkit-outer-spin-button,
                -webkit-inner-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
                -moz-appearance: textfield;
                text-align: center;
                border-radius: ${theme.borderRadius.default};
                border: 1px solid ${theme.colors.gray.eb};
              `}
            />
            votes
          </HStack>
        )}

        {!votingEnabled && (
          <HStack gap="1" alignItems="center">
            <img src={icons.vote} alt="vote" />
            <span>{proposal.voteCount}</span>
          </HStack>
        )}
      </HStack>
    </VStack>
  );
}

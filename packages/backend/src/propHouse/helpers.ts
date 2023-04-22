import { z } from "zod";
import { groupBy } from "lodash";

import { PropHouseAuctionStatus } from "../schema/resolvers/generated/types";

import { auction } from "./fetchAuction";
import { fetchVotesResponse } from "./fetchVotes";
import { auctionsAuction, fetchAuctionsResponse } from "./fetchAuctions";
import { proposal } from "./common";

export function statusForAuction(
  a: z.infer<typeof auctionsAuction>
): PropHouseAuctionStatus {
  const currentTime = new Date().toISOString();
  if (currentTime < a.startTime) {
    return PropHouseAuctionStatus.Pending;
  } else if (currentTime < a.proposalEndTime) {
    return PropHouseAuctionStatus.Proposing;
  } else if (currentTime < a.votingEndTime) {
    return PropHouseAuctionStatus.Active;
  } else {
    return PropHouseAuctionStatus.Executed;
  }
}

export function groupVotesByAuction(
  votes: z.infer<typeof fetchVotesResponse>,
  auctions: z.infer<typeof fetchAuctionsResponse>
): {
  auction: z.infer<typeof auctionsAuction>;
  createdAt: string;
  votes: { proposal: z.infer<typeof proposal>; weight: number }[];
}[] {
  return Object.entries(
    groupBy(
      votes.filter((vote) => vote.proposal.visible),
      (it) => it.auctionId.toString()
    )
  ).flatMap(([auctionId, votes]) => {
    const auction = auctions.find(
      (auction) => auction.id.toString() === auctionId
    );

    if (!auction) {
      return [];
    }

    if (!auction.visible) {
      return [];
    }

    const createdAt = votes
      .slice(1)
      .reduce(
        (acc, vote) => Math.max(new Date(vote.createdDate).valueOf(), acc),
        new Date(votes[0].createdDate).valueOf()
      );

    return [
      {
        auction,
        createdAt: createdAt.toString(),

        votes: Object.entries(
          groupBy(votes, (it) => it.proposalId.toString())
        ).map(([, votes]) => {
          return {
            proposal: votes[0].proposal,
            weight: votes.reduce((acc, vote) => acc + vote.weight, 0),
          };
        }),
      },
    ];
  });
}

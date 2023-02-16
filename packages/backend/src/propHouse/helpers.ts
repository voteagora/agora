import { z } from "zod";
import { groupBy } from "lodash";
import { auction } from "./fetchAuction";
import { fetchVotesResponse } from "./fetchVotes";
import { fetchAuctionsResponse } from "./fetchAuctions";
import { proposal } from "./common";
import { PropHouseAuctionStatus } from "../generated/types";

export function statusForAuction(
  a: z.infer<typeof auction>
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
  auction: z.infer<typeof auction>;
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

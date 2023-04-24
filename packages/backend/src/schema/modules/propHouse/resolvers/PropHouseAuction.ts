import { groupBy } from "lodash";
import { z } from "zod";

import { statusForAuction } from "../api/helpers";
import { fetchProposalsForAuction } from "../api/fetchProposalsForAuction";
import { auctionsAuction } from "../api/fetchAuctions";
import { Resolvers } from "../module";

export type PropHouseAuctionModel = z.infer<typeof auctionsAuction>;

export const PropHouseAuction: Resolvers["PropHouseAuction"] = {
  id({ id }) {
    return id.toString();
  },

  number({ id }) {
    return id;
  },

  status(auction) {
    return statusForAuction(auction);
  },

  async proposals({ id }) {
    return await fetchProposalsForAuction({
      auctionId: id.toString(),
    });
  },

  async votes(auction) {
    const { id: auctionId } = auction;

    const proposalsForAuction = await fetchProposalsForAuction({
      auctionId: auctionId.toString(),
    });

    const votesWithProposal = proposalsForAuction.flatMap((proposal) =>
      proposal.votes.map((vote) => ({ vote, proposal }))
    );

    return Object.values(
      groupBy(
        votesWithProposal.flatMap((it) => {
          if (!it.vote.address) {
            return [];
          }

          return [it];
        }),
        (it) => [it.vote.address.toLowerCase(), it.proposal.id]
      )
    ).map((votes) => {
      const firstVote = votes[0];
      return {
        address: { address: firstVote.vote.address },
        proposal: firstVote.proposal,
        weight: votes.reduce((acc, vote) => acc + vote.vote.weight, 0),
      };
    });
  },
};

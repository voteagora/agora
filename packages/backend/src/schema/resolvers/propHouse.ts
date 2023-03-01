import {
  PropHouseAuctionResolvers,
  PropHouseProposalResolvers,
} from "./generated/types";
import { auctionsAuction } from "../../propHouse/fetchAuctions";
import { z } from "zod";
import { proposal } from "../../propHouse/common";
import { fetchProposalsForAuction } from "../../propHouse/fetchProposalsForAuction";
import { groupBy } from "lodash";
import { statusForAuction } from "../../propHouse/helpers";

export type PropHouseAuctionModel = z.infer<typeof auctionsAuction>;

export const PropHouseAuction: PropHouseAuctionResolvers = {
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

export type PropHouseProposalModel = z.infer<typeof proposal>;

export const PropHouseProposal: PropHouseProposalResolvers = {
  id({ id }) {
    return `PropHouseProposal|${id}`;
  },

  number({ id }) {
    return id;
  },

  title({ title }) {
    return title;
  },

  tldr({ tldr }) {
    return tldr;
  },

  createdDate({ createdDate }) {
    return createdDate;
  },

  voteCount({ voteCount }) {
    return parseInt(voteCount);
  },

  proposer({ address }) {
    return { address };
  },
};

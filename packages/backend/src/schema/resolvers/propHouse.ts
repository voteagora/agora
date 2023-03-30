import { z } from "zod";

import { groupBy } from "lodash";

import { auctionsAuction, fetchAuctions } from "../../propHouse/fetchAuctions";
import { proposal } from "../../propHouse/common";
import { fetchProposalsForAuction } from "../../propHouse/fetchProposalsForAuction";

import { groupVotesByAuction, statusForAuction } from "../../propHouse/helpers";
import { fetchVotes } from "../../propHouse/fetchVotes";

import {
  DelegateResolvers,
  PropHouseAuctionResolvers,
  PropHouseProposalResolvers,
  QueryResolvers,
} from "./generated/types";

export type PropHouseAuctionModel = z.infer<typeof auctionsAuction>;

const stagingCommunityId = 15;
const productionCommunityId = 1;

const communityId = productionCommunityId;

export const Query: QueryResolvers = {
  async propHouseAuction(_, { auctionId }) {
    const auctions = await fetchAuctions({
      communityId,
    });

    return auctions.find((it) => it.id.toString() === auctionId)!;
  },

  async propHouseAuctions() {
    return await fetchAuctions({
      communityId,
    });
  },
};

export const Delegate: DelegateResolvers = {
  async propHouseVotes({ address }) {
    const votes = await fetchVotes({ voter: address });
    const auctions = await fetchAuctions({ communityId });
    const groupedVotes = groupVotesByAuction(votes, auctions);

    return groupedVotes.map((vote) => {
      return {
        id: `PropHouseRoundVotes|${address}|${vote.auction.id}`,
        address: { address },
        createdAt: new Date(vote.createdAt),
        round: vote.auction,
        votes: vote.votes.map((vote) => ({
          address: { address },
          proposal: vote.proposal,
          weight: vote.weight,
        })),
      };
    });
  },
};

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

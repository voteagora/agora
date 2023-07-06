import { groupBy } from "lodash";
import { z } from "zod";

import { statusForAuction } from "../api/helpers";
import { fetchProposalsForAuction } from "../api/fetchProposalsForAuction";
import { auctionsAuction } from "../api/fetchAuctions";
import { Resolvers } from "../module";
import { Reader } from "../../../../shared/indexer/storage/reader/type";
import {
  alligatorEntityDefinitions,
  getLiquidDelegatatedVoteLotsForSigner,
} from "../../../../shared/contracts/indexers/Alligator/entities/entities";
import { collectGenerator } from "../../../../shared/utils/generatorUtils";
import { fetchVotingPowerForAuction } from "../api/fetchVotingPowerForAuction";

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

export async function needsToVoteOnPropHouse(
  address: string,
  reader: Reader<typeof alligatorEntityDefinitions>,
  auction: PropHouseAuctionModel
): Promise<boolean> {
  const propStatus = statusForAuction(auction);

  if (propStatus !== "ACTIVE") {
    return false;
  }

  const liquidDelegatedVoteLots = await collectGenerator(
    await getLiquidDelegatatedVoteLotsForSigner(address, reader)
  );

  const accounts = [
    address,
    ...liquidDelegatedVoteLots.map((lot) => lot.proxy),
  ];

  const proposalsForAuction = await fetchProposalsForAuction({
    auctionId: auction.id.toString(),
  });

  const executedVotes = proposalsForAuction.reduce((acc, prop) => {
    return (
      prop.votes.reduce((totalWeight, vote) => {
        if (accounts.includes(vote.address)) {
          return vote.weight + totalWeight;
        }

        return totalWeight;
      }, 0) + acc
    );
  }, 0);

  const avaiableVotes = await accounts.reduce(async (acc, account) => {
    const sum = await acc;

    const votingPower = await fetchVotingPowerForAuction({
      auctionId: auction.id.toString(),
      voter: account,
    });

    return sum + votingPower;
  }, Promise.resolve(0));

  return avaiableVotes - executedVotes > 0;
}

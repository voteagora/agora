import { fetchVotes } from "../api/fetchVotes";
import { fetchAuctions } from "../api/fetchAuctions";
import { groupVotesByAuction } from "../api/helpers";
import { Resolvers } from "../module";

export const Delegate: Resolvers["Delegate"] = {
  async propHouseVotes(
    { address },
    _args,
    { errorReporter, propHouse: { communityId } }
  ) {
    const groupedVotes = await (async () => {
      try {
        const votes = await fetchVotes({ voter: address });
        const auctions = await fetchAuctions({ communityId });

        return groupVotesByAuction(votes, auctions);
      } catch (e) {
        errorReporter.captureException(e);
        return [];
      }
    })();

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

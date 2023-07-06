import { fetchAuctions } from "../api/fetchAuctions";
import { Resolvers } from "../module";

export const Query: Resolvers["Query"] = {
  async propHouseAuction(_, { auctionId }, { propHouse: { communityId } }) {
    const auctions = await fetchAuctions({
      communityId,
    });

    return auctions.find((it) => it.id.toString() === auctionId)!;
  },
};

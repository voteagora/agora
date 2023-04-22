import { fetchAuctions } from "./fetchAuctions";
import { fetchVotes } from "./fetchVotes";
import { groupVotesByAuction } from "./helpers";

it("groupVotesByAuction", async () => {
  const votes = await fetchVotes({
    voter: "0xC3FdAdbAe46798CD8762185A09C5b672A7aA36Bb",
  });
  const auctions = await fetchAuctions({ communityId: 1 });
  groupVotesByAuction(votes, auctions);
});

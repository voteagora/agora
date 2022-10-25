import {
  fetchAllVotes,
  fetchAuctions,
  fetchCommunity,
  fetchVotes,
  groupVotesByAuction,
} from "./propHouse";

describe("propHouse", () => {
  it("fetchCommunity", async () => {
    await fetchCommunity({ name: "nouns" });
  });

  it("fetchAuctions", async () => {
    await fetchAuctions({ communityId: 1 });
  });

  it("fetchVotes", async () => {
    await fetchVotes({ voter: "0x75Ee6eb3d8DAcf41eE2e5307090B197D3E1Cca6E" });
  });

  it("fetchAllVotes", async () => {
    await fetchAllVotes();
  });

  it("groupVotesByAuction", async () => {
    const votes = await fetchVotes({
      voter: "0xC3FdAdbAe46798CD8762185A09C5b672A7aA36Bb",
    });
    const auctions = await fetchAuctions({ communityId: 1 });
    groupVotesByAuction(votes, auctions);
  });
});

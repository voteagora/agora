import { fetchVotingPowerForAuction } from "./fetchVotingPowerForAuction";

it("fetchVotingPowerForAuction", async () => {
  await fetchVotingPowerForAuction({
    auctionId: "181",
    voter: "0x75Ee6eb3d8DAcf41eE2e5307090B197D3E1Cca6E",
  });
});

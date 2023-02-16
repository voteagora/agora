import { fetchProposalsForAuction } from "./fetchProposalsForAuction";

it("fetchProposalsForAuction", async () => {
  await fetchProposalsForAuction({
    auctionId: "124",
  });
});

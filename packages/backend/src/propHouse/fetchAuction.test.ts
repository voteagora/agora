import { fetchAuction } from "./fetchAuction";

it("fetchAuction", async () => {
  await fetchAuction({
    auctionId: "1",
  });
});

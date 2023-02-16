import { fetchAuctions } from "./fetchAuctions";

it("fetchAuctions", async () => {
  await fetchAuctions({ communityId: 1 });
});

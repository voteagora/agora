import { fetchCommunity } from "./fetchCommunity";

it("fetchCommunity", async () => {
  await fetchCommunity({ name: "nouns" });
});

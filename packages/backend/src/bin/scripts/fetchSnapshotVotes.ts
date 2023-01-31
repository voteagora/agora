import { fetchEverything } from "../../lambdas/loadSnapshotVotes/handler";
import { promises as fs } from "fs";

async function main() {
  const { proposals, space, votes } = await fetchEverything();

  await fs.writeFile("proposals.json", JSON.stringify(proposals));
  await fs.writeFile("space.json", JSON.stringify(space));
  await fs.writeFile("votes.json", JSON.stringify(votes));
}

main();

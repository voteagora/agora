import { getAllFromQuery, proposalsQuery, votesQuery } from "./queries";
import { promises as fs } from "fs";
import { loadJsonLines } from "../../../utils/jsonLines";
import { takeLast } from "../../../indexer/utils/generatorUtils";

const spaceId = "opcollective.eth";

async function main() {
  const { path, query } = (() => {
    switch (process.argv[2]) {
      case "votes": {
        return {
          path: "data/snapshot/votes.jsonl",
          query: votesQuery,
        };
      }

      case "proposals": {
        return {
          path: "data/snapshot/proposals.jsonl",
          query: proposalsQuery,
        };
      }

      default: {
        throw new Error("unknown type");
      }
    }
  })();

  const lastEntry = await takeLast(loadJsonLines<{ created: number }>(path));

  const votesFile = await fs.open(path, "a+");
  for await (const vote of (async function* () {
    for await (const voteBatch of getAllFromQuery(
      query as any,
      { space: spaceId },
      lastEntry?.created ?? undefined
    )) {
      yield* voteBatch;
    }
  })()) {
    await votesFile.write(JSON.stringify(vote) + "\n");
  }
}

main();

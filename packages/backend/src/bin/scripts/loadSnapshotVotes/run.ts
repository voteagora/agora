import { getAllFromQuery, proposalsQuery, votesQuery } from "./queries";
import { promises as fs } from "fs";
import { loadJsonLines } from "../../../utils/jsonLines";
import { takeLast } from "../../../indexer/utils/generatorUtils";
import path from "path";

const spaceId = "opcollective.eth";

async function main() {
  const basePath = `data/snapshot/${spaceId}`;

  await fs.mkdir(basePath, { recursive: true });

  const { file, query } = (() => {
    switch (process.argv[2]) {
      case "votes": {
        return {
          file: path.join(basePath, `votes.jsonl`),
          query: votesQuery,
        };
      }

      case "proposals": {
        return {
          file: path.join(basePath, "proposals.jsonl"),
          query: proposalsQuery,
        };
      }

      default: {
        throw new Error("unknown type");
      }
    }
  })();

  const lastEntry = await takeLast(loadJsonLines<{ created: number }>(file));

  const votesFile = await fs.open(file, "a+");
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

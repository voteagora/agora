import {
  getAllFromQuery,
  proposalsQuery,
  votesQuery,
} from "../../../lambdas/loadSnapshotVotes/queries";
import { promises as fs } from "fs";
import { loadJsonLines } from "../../../utils/jsonLines";
import { takeLast } from "../../../indexer/utils/generatorUtils";
import path from "path";

const spaceId = "ens.eth";

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

  const lastEntry = await takeLast(
    loadJsonLines<{ id: string; created: number }>(file)
  );

  const votesFile = await fs.open(file, "a+");
  let hasSeenLastEntry = false;

  for await (const vote of (async function* () {
    let votes = getAllFromQuery(
      query as any,
      { space: spaceId },
      lastEntry?.created ?? undefined
    );

    for await (const voteBatch of votes) {
      for (const item of voteBatch) {
        if (!lastEntry || hasSeenLastEntry) {
          yield item;
        }

        if (lastEntry && (item as any).id === lastEntry.id) {
          hasSeenLastEntry = true;
        }
      }
    }
  })()) {
    await votesFile.write(JSON.stringify(vote) + "\n");
  }
}

main();

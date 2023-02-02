import { LevelEntityStore } from "../storage/level/levelEntityStore";
import { createReadStream } from "fs";
import * as readline from "readline";
import { StoredEntry } from "../storage/dump";

async function main() {
  const entityStore = await LevelEntityStore.open();
  const level = entityStore.level;

  await level.clear();

  for await (const line of readline.createInterface({
    input: createReadStream("dump.jsonl"),
    crlfDelay: Infinity,
  })) {
    if (!line.length) {
      continue;
    }

    const item = JSON.parse(line) as StoredEntry;
    await level.put(item.key, item.value);
  }
}

main();

import { createReadStream } from "fs";
import * as readline from "readline";
import { StoredEntry } from "../storage/dump";
import { LmdbEntityStore } from "../storage/lmdb/lmdbEntityStore";

async function main() {
  const entityStore = await LmdbEntityStore.open();

  await entityStore.lmdb.clearAsync();

  for await (const line of readline.createInterface({
    input: createReadStream("dump.jsonl"),
    crlfDelay: Infinity,
  })) {
    if (!line.length) {
      continue;
    }

    const item = JSON.parse(line) as StoredEntry;
    entityStore.lmdb.put(item.key, item.value);
  }
}

main();

import readline from "readline";
import { createReadStream } from "fs";
import { StoredEntry } from "../storage/dump";

export async function* loadExportFile() {
  for await (const line of readline.createInterface({
    input: createReadStream("dump.jsonl"),
    crlfDelay: Infinity,
  })) {
    if (!line.length) {
      continue;
    }

    const item = JSON.parse(line) as StoredEntry;
    yield item;
  }
}

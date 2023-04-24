import path from "path";

import { StoredEntry } from "../storage/dump";
import { loadJsonLines } from "../../utils/jsonLines";

export async function* loadExportFile(dataDirectory: string) {
  yield* loadJsonLines<StoredEntry>(dumpFilePath(dataDirectory));
}

export function dumpFilePath(dataDirectory: string) {
  return path.join(dataDirectory, "dump.jsonl");
}

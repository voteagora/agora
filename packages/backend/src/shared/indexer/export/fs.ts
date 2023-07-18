import path from "path";

import { StoredEntry } from "../storage/dump";
import { loadJsonLines } from "../../utils/jsonLines";

const env = process.env.AGORA_INSTANCE_ENV || "dev";

export async function* loadExportFile(dataDirectory: string) {
  yield* loadJsonLines<StoredEntry>(dumpFilePath(dataDirectory));
}

export function dumpFilePath(dataDirectory: string) {
  return path.join(dataDirectory, `dump-${env}.jsonl`);
}

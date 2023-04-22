import { loadJsonLines } from "../../utils/jsonLines";
import { StoredEntry } from "../storage/dump";

export async function* loadExportFile() {
  yield* loadJsonLines<StoredEntry>("data/dump/Nouns.jsonl");
}

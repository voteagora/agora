import { Env } from "./env";
import { Snapshot } from "../snapshot";

let latestSnapshot = null;

export async function loadSnapshot(env: Env) {
  return await env.INDEXER.get("snapshot.json", "json");
}

export async function getOrInitializeLatestSnapshot(
  init: () => Promise<Snapshot>
): Promise<Snapshot> {
  if (latestSnapshot) {
    return latestSnapshot;
  }

  const newValue = await init();
  latestSnapshot = newValue;
  return newValue;
}

export function updateLatestSnapshot(nextSnapshot: Snapshot) {
  latestSnapshot = nextSnapshot;
}

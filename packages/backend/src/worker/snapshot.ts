import { Env } from "./env";
import { parseStorage, Snapshot } from "../snapshot";

let latestSnapshot = null;

const snapshotKey = "snapshot.json";

export async function loadSnapshot(env: Env) {
  const snapshotValue = await env.SNAPSHOT.get(snapshotKey);
  return snapshotValue.json();
}

export async function writeSnapshot(env: Env, nextSnapshot: any) {
  updateLatestSnapshot(parseStorage(nextSnapshot));
  const serializedSnapshot = JSON.stringify(nextSnapshot);
  await env.SNAPSHOT.put(snapshotKey, serializedSnapshot);
}

function updateLatestSnapshot(nextSnapshot: Snapshot) {
  latestSnapshot = nextSnapshot;
}

async function initSnapshot(env: Env) {
  const snapshot = await loadSnapshot(env);
  return parseStorage(snapshot);
}

export async function getOrInitializeLatestSnapshot(
  env: Env
): Promise<Snapshot> {
  if (latestSnapshot) {
    return latestSnapshot;
  }

  const newValue = await initSnapshot(env);
  latestSnapshot = newValue;
  return newValue;
}

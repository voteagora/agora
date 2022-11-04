import { Env } from "./env";
import { parseStorage, Snapshot } from "../snapshot";
import { getCompressor } from "./compress";

let latestSnapshot = null;

const snapshotKey = "snapshot.json.br";

export async function loadSnapshot(env: Env) {
  const snapshotValue = env.INDEXER.get(snapshotKey, "arrayBuffer");

  const compressor = await getCompressor();
  const decompressed = compressor.decompress(snapshotValue);

  return JSON.parse(decompressed);
}

export async function writeSnapshot(env: Env, nextSnapshot: any) {
  updateLatestSnapshot(parseStorage(nextSnapshot));
  const serializedSnapshot = JSON.stringify(nextSnapshot);

  const compressor = await getCompressor();
  const compressed = compressor.compress(serializedSnapshot);

  await env.INDEXER.put(snapshotKey, compressed);
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

import { ethers } from "ethers";
import { LevelEntityStore } from "../entityStore";
import { indexers } from "../contracts";
import { followChain } from "../followChain";

/**
 * Processes and writes updates for finalized blocks from stored logs.
 */
async function main() {
  const store = await LevelEntityStore.open();

  const provider = new ethers.providers.JsonRpcProvider(
    "https://rpc.ankr.com/optimism"
  );

  const storageArea = followChain(store, indexers, provider);
  console.log({ storageArea });
}

main();

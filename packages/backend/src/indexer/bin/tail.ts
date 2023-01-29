import { ethers } from "ethers";
import { indexers } from "../contracts";
import { followChain } from "../followChain";
import { LevelEntityStore } from "../storage/level/levelEntityStore";

/**
 * Processes and writes updates for finalized blocks from stored logs.
 */
async function main() {
  const store = await LevelEntityStore.open();

  const provider = new ethers.providers.AlchemyProvider(
    "optimism",
    process.env.ALCHEMY_API_KEY
  );

  const storageArea = await followChain(store, indexers, provider);
  console.log({ storageArea });
}

main();

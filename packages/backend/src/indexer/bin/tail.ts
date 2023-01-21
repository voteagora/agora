import { ethers } from "ethers";
import { LevelEntityStore } from "../entityStore";
import { indexers } from "../contracts";
import { followChain } from "../followChain";

/**
 * Processes and writes updates for finalized blocks from stored logs.
 */
async function main() {
  const store = await LevelEntityStore.open();

  const provider = new ethers.providers.AlchemyProvider(
    "optimism",
    process.env.ALCHEMY_API_KEY
  );

  const storageArea = followChain(store, indexers, provider);
  console.log({ storageArea });
}

main();

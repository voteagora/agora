import { ethers } from "ethers";
import { indexers } from "../contracts";
import { followChain, makeInitialStorageArea } from "../followChain";
import { LevelEntityStore } from "../storage/level/levelEntityStore";
import { timeout } from "../utils/asyncUtils";

/**
 * Processes and writes updates for finalized blocks from stored logs.
 */
async function main() {
  const store = await LevelEntityStore.open();

  const provider = new ethers.providers.AlchemyProvider(
    "optimism",
    process.env.ALCHEMY_API_KEY
  );

  const storageArea = await makeInitialStorageArea(store);
  const iter = followChain(store, indexers, provider, storageArea);

  while (true) {
    const value = await iter();
    console.log({ value });
    switch (value.type) {
      case "TIP": {
        await timeout(1000);
      }
    }
  }
}

main();

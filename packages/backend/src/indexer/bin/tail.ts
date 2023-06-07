import { ethers } from "ethers";
import { entityDefinitions, indexers } from "../contracts";
import { followChain, makeInitialStorageArea } from "../followChain";
import { LevelEntityStore } from "../storage/level/levelEntityStore";
import { timeout } from "../utils/asyncUtils";
import { EthersBlockProvider } from "../blockProvider/blockProvider";
import { EthersLogProvider } from "../logProvider/logProvider";

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
  const blockProvider = new EthersBlockProvider(provider);
  const logProvider = new EthersLogProvider(provider);
  const iter = followChain(
    store,
    indexers,
    entityDefinitions,
    blockProvider,
    logProvider,
    storageArea,
    process.argv[2] || "dev"
  );

  while (true) {
    const value = await iter();
    console.log({ value });

    if (value) {
      switch (value.type) {
        case "TIP": {
          await timeout(1000);
        }
      }
    }
  }
}

main();

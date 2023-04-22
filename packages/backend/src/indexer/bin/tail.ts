import { ethers } from "ethers";

import { makeProvider } from "../../provider";
import { EthersBlockProvider } from "../blockProvider/blockProvider";
import { indexers } from "../contracts";
import { entityDefinitions } from "../contracts/entityDefinitions";
import { followChain, makeInitialStorageArea } from "../followChain";
import { EthersLogProvider } from "../logProvider/logProvider";
import { LevelEntityStore } from "../storage/level/levelEntityStore";
import { timeout } from "../utils/asyncUtils";

/**
 * Processes and writes updates for finalized blocks from stored logs.
 */
async function main() {
  const store = await LevelEntityStore.open();

  const provider = makeProvider();

  const storageArea = await makeInitialStorageArea(store);
  const blockProvider = new EthersBlockProvider(provider);
  const logProvider = new EthersLogProvider(provider);
  const iter = followChain(
    store,
    indexers,
    entityDefinitions,
    blockProvider,
    logProvider,
    storageArea
  );

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

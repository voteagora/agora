import { ethers } from "ethers";

import { followChain, makeInitialStorageArea } from "../process/followChain";
import { timeout } from "../../utils/asyncUtils";
import { EthersBlockProvider } from "../blockProvider/blockProvider";
import { EthersLogProvider } from "../logProvider/logProvider";
import { EntityStore } from "../storage/entityStore/entityStore";
import { IndexerDefinition } from "../process/indexerDefinition";
import { EntityDefinitions } from "../storage/reader/type";

/**
 * Processes and writes updates for finalized blocks from stored logs.
 */
export async function tail(
  store: EntityStore,
  entityDefinitions: EntityDefinitions,
  indexers: IndexerDefinition[],
  provider: ethers.providers.JsonRpcProvider
) {
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

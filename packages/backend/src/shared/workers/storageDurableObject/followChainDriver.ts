import { ethers } from "ethers";

import { AnalyticsEngineReporter } from "../../indexer/storage/entityStore/durableObjects/storageInterface/analyticsEngineReporter";
import { DurableObjectEntityStore } from "../../indexer/storage/entityStore/durableObjects/durableObjectEntityStore";
import {
  followChain,
  makeInitialStorageArea,
} from "../../indexer/process/followChain";
import { EthersBlockProvider } from "../../indexer/blockProvider/blockProvider";
import { EthersLogProvider } from "../../indexer/logProvider/logProvider";
import { IndexerDefinition } from "../../indexer/process/indexerDefinition";
import { EntityDefinitions } from "../../indexer/storage/reader/type";
import { TracingBlockProvider } from "../../indexer/blockProvider/tracingBlockProvider";
import { TracingLogProvider } from "../../indexer/logProvider/tracingLogProvider";

export class FollowChainDriver {
  private readonly storage: AnalyticsEngineReporter;
  private readonly stepChainEntityStore: DurableObjectEntityStore;
  private iter: ReturnType<typeof followChain> | null = null;
  private readonly provider: ethers.providers.JsonRpcProvider;
  private readonly indexers: IndexerDefinition[];
  private readonly entityDefinitions: EntityDefinitions;
  #lastResult: Awaited<ReturnType<ReturnType<typeof followChain>>> | null =
    null;

  constructor(
    storage: AnalyticsEngineReporter,
    provider: ethers.providers.JsonRpcProvider,
    indexers: IndexerDefinition[],
    entityDefinitions: EntityDefinitions
  ) {
    this.storage = storage;
    this.stepChainEntityStore = new DurableObjectEntityStore(storage);
    this.provider = provider;
    this.indexers = indexers;
    this.entityDefinitions = entityDefinitions;
  }

  async stepChainForward() {
    await this.stepChainEntityStore.ensureConsistentState();

    const iter =
      this.iter ??
      (await (async () => {
        const storageArea = await makeInitialStorageArea(
          this.stepChainEntityStore
        );
        const blockProvider = new TracingBlockProvider(
          new EthersBlockProvider(this.provider)
        );
        const logProvider = new TracingLogProvider(
          new EthersLogProvider(this.provider)
        );
        return followChain(
          this.stepChainEntityStore,
          this.indexers,
          this.entityDefinitions,
          blockProvider,
          logProvider,
          storageArea
        );
      })());

    try {
      const result = await iter();
      this.#lastResult = result;
      return result;
    } finally {
      this.storage.flushIoReport(["kind:write"]);
    }
  }

  get lastResult() {
    return this.#lastResult;
  }
}

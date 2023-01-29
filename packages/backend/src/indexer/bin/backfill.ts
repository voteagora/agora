import { EntityWithMetadata } from "../storage/entityStore";
import { IndexerDefinition } from "../process";
import { groupBy } from "../utils/generatorUtils";
import { loadLastLogIndex, loadMergedLogs } from "../logStorage";
import {
  BlockIdentifier,
  makeStorageHandleWithStagingArea,
} from "../storageHandle";
import { indexers } from "../contracts";
import { StructuredError } from "../utils/errorUtils";
import { ethers } from "ethers";
import ProgressBar from "progress";
import { LevelEntityStore } from "../storage/level/levelEntityStore";

/**
 * Backfills updates from fetched logs starting from the last finalized block
 * to the highest fetched block across all contracts. This does not reach out
 * to the network.
 */
async function main() {
  const store = await LevelEntityStore.open();

  const highestCommonBlock = await calculateHighestCommonBlock(indexers);
  if (!highestCommonBlock) {
    return;
  }

  const entityStoreFinalizedBlock = await store.getFinalizedBlock();
  if (
    entityStoreFinalizedBlock &&
    entityStoreFinalizedBlock.blockNumber >= highestCommonBlock.blockNumber
  ) {
    return;
  }

  const progressBar = new ProgressBar(
    ":elapseds [:current/:total] :bar :percent @ :rate/s :etas remaining",
    {
      total: highestCommonBlock.blockNumber,
    }
  );

  let idx = 0;
  const blockLogGenerator = groupBy(loadMergedLogs(indexers), (log) =>
    log.blockNumber.toString()
  );

  for await (const blockLogs of blockLogGenerator) {
    const [firstLog] = blockLogs;
    progressBar.tick(Math.max(firstLog.blockNumber - progressBar.curr, 0));

    if (
      entityStoreFinalizedBlock &&
      firstLog.blockNumber <= entityStoreFinalizedBlock.blockNumber
    ) {
      continue;
    }

    if (firstLog.blockNumber > highestCommonBlock.blockNumber) {
      break;
    }

    const entityBlockStagingArea = new Map<string, EntityWithMetadata>();

    for (const log of blockLogs) {
      const indexer = indexers.find(
        (it) => it.address.toLowerCase() === log.address.toLowerCase()
      )!;

      const event = indexer.iface.parseLog(log);
      const eventHandler = indexer.eventHandlers.find(
        (e) => e.signature === event.signature
      )!;

      const loadedEntities: EntityWithMetadata[] = [];
      try {
        await eventHandler.handle(
          makeStorageHandleWithStagingArea(
            entityBlockStagingArea,
            store,
            indexer.entities,
            loadedEntities
          ),
          event as any,
          log
        );
      } catch (e) {
        throw new StructuredError(
          {
            log,
            event,
            loaded: loadedEntities,
          },
          e
        );
      }

      idx++;
    }

    await store.flushUpdates(
      blockIdentifierFromLog(firstLog),
      indexers,
      entityBlockStagingArea
    );
  }

  const totalEntries = new Map<string, any>();
  await store.flushUpdates(highestCommonBlock, indexers, totalEntries);
}

function blockIdentifierFromLog(log: ethers.providers.Log): BlockIdentifier {
  return {
    hash: log.blockHash,
    blockNumber: log.blockNumber,
  };
}

async function calculateHighestCommonBlock(
  indexers: IndexerDefinition[]
): Promise<BlockIdentifier | null> {
  const latestBlockPerIndex = await Promise.all(
    indexers.map((indexer) => loadLastLogIndex(indexer))
  );

  let lowestBlock: BlockIdentifier | null = null;
  for (const latestBlock of latestBlockPerIndex) {
    if (!latestBlock) {
      return null;
    }

    if (!lowestBlock || latestBlock.blockNumber < lowestBlock.blockNumber) {
      lowestBlock = latestBlock;
    }
  }

  return lowestBlock;
}

main();

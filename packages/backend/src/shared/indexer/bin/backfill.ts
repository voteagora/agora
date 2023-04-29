import { ethers } from "ethers";

import { makeLogProcessor } from "../process/process";
import { groupBy } from "../../utils/generatorUtils";
import { loadLastLogIndex, loadMergedLogs } from "../logStorage";
import {
  BlockIdentifier,
  makeStorageHandleWithStagingArea,
} from "../process/storageHandle";
import { StructuredError } from "../../utils/errorUtils";
import { makeProgressBarWithRate } from "../../utils/progressBarUtils";
import {
  EntityStore,
  EntityWithMetadata,
} from "../storage/entityStore/entityStore";
import { IndexerDefinition } from "../process/indexerDefinition";
import { EntityDefinitions } from "../storage/reader/type";

/**
 * Backfills updates from fetched logs starting from the last finalized block
 * to the highest fetched block across all contracts. This does not reach out
 * to the network.
 */
export async function backfill(
  store: EntityStore,
  indexers: IndexerDefinition[],
  entityDefinitions: EntityDefinitions,
  lastBlockToIndexArgument: BlockIdentifier | null,
  dataDirectory: string
) {
  const highestCommonBlock = await calculateHighestCommonBlock(
    indexers,
    dataDirectory
  );
  if (!highestCommonBlock) {
    return;
  }

  const lastBlockToIndex = (() => {
    if (!lastBlockToIndexArgument) {
      return highestCommonBlock;
    }

    if (lastBlockToIndexArgument.blockNumber < highestCommonBlock.blockNumber) {
      return lastBlockToIndexArgument;
    }

    return highestCommonBlock;
  })();

  console.log({ lastBlockToIndex });

  const entityStoreFinalizedBlock = await store.getFinalizedBlock();
  if (
    entityStoreFinalizedBlock &&
    entityStoreFinalizedBlock.blockNumber >= lastBlockToIndex.blockNumber
  ) {
    return;
  }

  const progressBar = makeProgressBarWithRate(lastBlockToIndex.blockNumber);

  let idx = 0;
  const blockLogGenerator = groupBy(
    loadMergedLogs(indexers, dataDirectory),
    (log) => log.blockNumber.toString()
  );

  for await (const blockLogs of blockLogGenerator) {
    const [firstLog] = blockLogs;
    progressBar.tick({ tickValue: firstLog.blockNumber });

    if (
      entityStoreFinalizedBlock &&
      firstLog.blockNumber <= entityStoreFinalizedBlock.blockNumber
    ) {
      continue;
    }

    if (firstLog.blockNumber > lastBlockToIndex.blockNumber) {
      break;
    }

    const entityBlockStagingArea = new Map<string, EntityWithMetadata>();

    for (const log of blockLogs) {
      const { eventAbi, handler, args } = makeLogProcessor(indexers, log);

      const [storageHandle, loadedEntities] = makeStorageHandleWithStagingArea(
        entityBlockStagingArea,
        store,
        entityDefinitions
      );

      try {
        await handler.handle(storageHandle, args, log);
      } catch (e) {
        throw new StructuredError(
          {
            log,
            eventArgs: args,
            eventAbi: eventAbi,
            loaded: loadedEntities,
          },
          e
        );
      }

      idx++;
    }

    await store.flushUpdates(
      blockIdentifierFromLog(firstLog),
      entityDefinitions,
      Array.from(entityBlockStagingArea.values())
    );
  }

  await store.flushUpdates(lastBlockToIndex, entityDefinitions, []);
}

function blockIdentifierFromLog(log: ethers.providers.Log): BlockIdentifier {
  return {
    hash: log.blockHash,
    blockNumber: log.blockNumber,
  };
}

async function calculateHighestCommonBlock(
  indexers: IndexerDefinition[],
  basePath: string
): Promise<BlockIdentifier | null> {
  const latestBlockPerIndex = await Promise.all(
    indexers.map(async (indexer) => {
      const index = await loadLastLogIndex(indexer, basePath);

      if (!index) {
        throw new Error(`missing logs for ${indexer.name}, run fetch`);
      }

      return index;
    })
  );

  let lowestBlock: BlockIdentifier | null = null;
  for (const indexValue of latestBlockPerIndex) {
    if (!lowestBlock || indexValue.blockNumber < lowestBlock.blockNumber) {
      lowestBlock = indexValue;
    }
  }

  return lowestBlock;
}

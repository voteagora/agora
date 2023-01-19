import { ethers } from "ethers";
import {
  EntityDefinition,
  IndexerDefinition,
  isBlockDepthFinalized,
  maxReorgBlocksDepth,
} from "../process";
import {
  BlockIdentifier,
  makeStorageHandleForShallowBlocks,
  makeStorageHandleWithStagingArea,
} from "../storageHandle";
import { Level } from "level";
import {
  combineEntities,
  EntityStore,
  EntityWithMetadata,
  LevelEntityStore,
  serializeEntities,
} from "../entityStore";
import { loadLastLogIndex, loadMergedLogs } from "../logStorage";
import { isTopicInBloom } from "web3-utils";
import { BlockProviderBlock, BlockProviderImpl } from "../blockProvider";
import { collectGenerator, groupBy } from "../utils/generatorUtils";
import { timeout } from "../utils/asyncUtils";
import { makeIndexEntries, withIndexFields } from "../fieldIndex";
import { concatMaps } from "../utils/mapUtils";
import { indexers } from "../contracts";
import { EthersLogProvider, topicFilterForIndexers } from "../logProvider";

/**
 * Processes and writes updates for finalized blocks from stored logs.
 */
async function processStoredLogs(
  store: EntityStore,
  indexers: IndexerDefinition[]
) {
  const entityStoreFinalizedBlock = await store.getFinalizedBlock();

  const highestCommonBlock = await calculateHighestCommonBlock(indexers);
  if (!highestCommonBlock) {
    return;
  }

  if (
    entityStoreFinalizedBlock &&
    entityStoreFinalizedBlock.blockNumber >= highestCommonBlock.blockNumber
  ) {
    return;
  }

  let idx = 0;
  const blockLogGenerator = groupBy(loadMergedLogs(indexers), (log) =>
    log.blockNumber.toString()
  );

  const entityDefinitions = combineEntities(indexers);

  for await (const blockLogs of blockLogGenerator) {
    const [firstLog] = blockLogs;
    if (
      entityStoreFinalizedBlock &&
      firstLog.blockNumber <= entityStoreFinalizedBlock.blockNumber
    ) {
      continue;
    }

    if (firstLog.blockNumber > highestCommonBlock.blockNumber) {
      break;
    }

    const entityBlockStagingArea = new Map<string, any>();

    for (const log of blockLogs) {
      // 10k / s for memory
      // 5k / s for disk
      console.log({
        idx,
        block: log.blockNumber,
      });

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
            indexer,
            loadedEntities
          ),
          event as any,
          log
        );
      } catch (e) {
        // todo: merge these somehow
        console.log(JSON.stringify({ log, event, loaded: loadedEntities }));
        throw e;
      }

      idx++;
    }

    await store.updateFinalizedBlock(
      {
        hash: firstLog.blockHash,
        blockNumber: firstLog.blockNumber,
      },
      serializeEntities(entityDefinitions, entityBlockStagingArea)
    );
  }

  const totalEntries = new Map<string, any>();

  // for backfilling, process all entities at the end. this avoids writing and
  // overwriting the index but makes the reducers accessing values through the
  // index not possible.
  for await (const entity of store.getEntities()) {
    const entityDefinition: EntityDefinition = (entityDefinitions as any)[
      entity.entity
    ];
    const value = entityDefinition.serde.deserialize(entity.value);

    const entries = makeIndexEntries(
      {
        id: entity.id,
        entity: entity.entity,
        value,
      },
      entityDefinition
    );
    concatMaps(totalEntries, new Map(entries));
  }

  await store.updateFinalizedBlock(highestCommonBlock, totalEntries);
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

async function main() {
  const level = new Level<string, any>("./data/state", {
    valueEncoding: "json",
  });
  const store = new LevelEntityStore(level);

  await processStoredLogs(store, indexers);

  const provider = new ethers.providers.AlchemyProvider(
    "optimism",
    process.env.ALCHEMY_API_KEY
  );

  const blockProvider = new BlockProviderImpl(provider);
  const logsProvider = new EthersLogProvider(provider);

  const parents = new Map<string, BlockIdentifier>();
  const stagedEntitiesStorage = new Map<string, Map<string, any>>();
  const filter = topicFilterForIndexers(indexers);
  const topics = filter.topics[0];

  async function ensureParentsAvailable(
    hash: string,
    latestBlockHeight: number,
    depth: number
  ): Promise<void> {
    if (isBlockDepthFinalized(depth)) {
      return;
    }

    const parentBlock = parents.get(hash);
    if (parentBlock) {
      return await ensureParentsAvailable(
        parentBlock.hash,
        latestBlockHeight,
        depth + 1
      );
    }

    const block = await blockProvider.getBlockByHash(hash);

    await ensureParentsAvailable(
      block.parentHash,
      latestBlockHeight,
      depth + 1
    );

    await processBlock(block, latestBlockHeight);

    parents.set(block.hash, {
      hash: block.parentHash,
      blockNumber: block.number - 1,
    });
  }

  async function processBlock(
    block: BlockProviderBlock,
    latestBlockHeight: number,
    logsCache?: Map<string, ethers.providers.Log[]>
  ) {
    const nextBlockDepth = latestBlockHeight - block.number;

    const shouldCheckBlock = !!topics.find((topic) =>
      isTopicInBloom(block.logsBloom, topic)
    );
    if (shouldCheckBlock) {
      const logs =
        logsCache?.get(block.hash) ??
        (await logsProvider.getLogs({
          blockHash: block.hash,
          ...filter,
        }));

      for (const log of logs) {
        const indexer = indexers.find(
          (it) => it.address.toLowerCase() === log.address.toLowerCase()
        )!;

        const event = indexer.iface.parseLog(log);
        const eventHandler = indexer.eventHandlers.find(
          (e) => e.signature === event.signature
        )!;

        const { storageHandle, finalize } = (() => {
          if (isBlockDepthFinalized(nextBlockDepth)) {
            const stagingArea = new Map<string, any>();

            return {
              storageHandle: makeStorageHandleWithStagingArea(
                stagingArea,
                store,
                indexer
              ),
              finalize: () =>
                store.updateFinalizedBlock(
                  {
                    hash: block.hash,
                    blockNumber: block.number,
                  },
                  serializeEntities(
                    indexer.entities,
                    withIndexFields(stagingArea, [indexer])
                  )
                ),
            };
          } else {
            return {
              storageHandle: makeStorageHandleForShallowBlocks(
                stagedEntitiesStorage,
                parents,
                block,
                latestBlockHeight,
                store,
                indexer
              ),
              finalize: async () => {
                // nop, finalization for these blocks is handled during promotion
              },
            };
          }
        })();

        await eventHandler.handle(storageHandle, event as any, log);

        await finalize();
      }
    }
  }

  function promoteFinalizedBlocks(
    latestBlockNumber: number,
    blockHash: string
  ) {
    const blockIdentifier = parents.get(blockHash);
    if (!blockIdentifier) {
      // todo: parents will grow indefinitely
      throw new Error("cannot find parent block");
    }

    const depth = latestBlockNumber - blockIdentifier.blockNumber;
    if (!isBlockDepthFinalized(depth)) {
      promoteFinalizedBlocks(latestBlockNumber, blockIdentifier.hash);
      return;
    }

    const storageArea =
      stagedEntitiesStorage.get(blockIdentifier.hash) ?? new Map<string, any>();

    const entityDefinitions = combineEntities(indexers);

    store.updateFinalizedBlock(
      {
        hash: blockIdentifier.hash,
        blockNumber: blockIdentifier.blockNumber,
      },
      serializeEntities(
        entityDefinitions,
        withIndexFields(storageArea, indexers)
      )
    );
  }

  const entityStoreFinalizedBlock = await store.getFinalizedBlock();
  let nextBlockNumber = entityStoreFinalizedBlock
    ? entityStoreFinalizedBlock.blockNumber + 1
    : indexers.reduce(
        (acc, it) => Math.min(it.startingBlock, acc),
        indexers[0].startingBlock
      );

  while (true) {
    const latestBlock = await blockProvider.getLatestBlock();
    if (latestBlock.number <= nextBlockNumber) {
      console.log("at tip!");
      // we're ahead of the tip, continue
      await timeout(1000);
      continue;
    }

    const fetchTill = Math.min(latestBlock.number, nextBlockNumber + 1000);

    const blocks = await blockProvider.getBlockRange(
      nextBlockNumber,
      fetchTill
    );

    const fetchLogsCacheTill = Math.max(
      Math.min(
        latestBlock.number - maxReorgBlocksDepth - 1,
        nextBlockNumber + 1000
      ),
      nextBlockNumber
    );
    const logs = await logsProvider.getLogs({
      ...filter,
      fromBlock: nextBlockNumber,
      toBlock: fetchLogsCacheTill,
    });

    const groupedLogs = await collectGenerator(
      groupBy(
        (async function* () {
          for (const log of logs) {
            yield log;
          }
        })(),
        (log) => log.blockNumber.toString()
      )
    );

    const logsCache = new Map([
      ...blocks.flatMap<[string, ethers.providers.Log[]]>((block) => {
        if (!isBlockDepthFinalized(block.number)) {
          return [];
        }

        return [[block.hash, []]];
      }),
      ...groupedLogs.map<[string, ethers.providers.Log[]]>((it) => [
        it[0].blockHash,
        it,
      ]),
    ]);

    console.log({
      blocks: blocks.length,
      depth: latestBlock.number - nextBlockNumber,
    });

    for (const nextBlock of blocks) {
      parents.set(nextBlock.hash, {
        blockNumber: nextBlock.number - 1,
        hash: nextBlock.parentHash,
      });

      await ensureParentsAvailable(
        nextBlock.hash,
        latestBlock.number,
        latestBlock.number - nextBlock.number
      );

      await processBlock(nextBlock, latestBlock.number, logsCache);

      promoteFinalizedBlocks(latestBlock.number, nextBlock.hash);

      nextBlockNumber = nextBlock.number + 1;
    }
  }
}

main();

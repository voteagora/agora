import { ethers } from "ethers";
import {
  IndexerDefinition,
  isBlockDepthFinalized,
  maxReorgBlocksDepth,
  optimismReducer,
} from "../process";
import {
  BlockIdentifier,
  makeStorageHandleForShallowBlocks,
  makeStorageHandleWithStagingArea,
} from "../storageHandle";
import { Level } from "level";
import { EntityStore, LevelEntityStore } from "../entityStore";
import { loadLastLogIndex, loadReducerLogs } from "../logStorage";
import { isTopicInBloom } from "web3-utils";
import { BlockProviderBlock, BlockProviderImpl } from "../blockProvider";
import { collectGenerator, groupBy } from "../utils/generatorUtils";
import { timeout } from "../utils/asyncUtils";
import { makeIndexEntries, withIndexFields } from "../fieldIndex";
import { concatMaps } from "../utils/mapUtils";
import { filterForEventHandlers, topicsForSignatures } from "../../contracts";

/**
 * Processes and writes updates for finalized blocks from stored logs.
 */
async function processStoredLogs(
  store: EntityStore,
  reducer: IndexerDefinition<any, any>
) {
  const entityStoreFinalizedBlock = await store.getFinalizedBlock();

  const lastFinalizedBlock = await loadLastLogIndex(reducer);

  if (
    lastFinalizedBlock &&
    (!entityStoreFinalizedBlock ||
      lastFinalizedBlock.blockNumber > entityStoreFinalizedBlock.blockNumber)
  ) {
    let idx = 0;
    const blockLogGenerator = groupBy(loadReducerLogs(reducer), (log) =>
      log.blockNumber.toString()
    );

    for await (const blockLogs of blockLogGenerator) {
      const [firstLog] = blockLogs;
      if (
        entityStoreFinalizedBlock &&
        firstLog.blockNumber <= entityStoreFinalizedBlock.blockNumber
      ) {
        continue;
      }

      if (firstLog.blockNumber > lastFinalizedBlock.blockNumber) {
        break;
      }

      // todo: no way around large batch loads
      // todo: index building on fields

      const entityBlockStagingArea = new Map<string, any>();

      for (const log of blockLogs) {
        // 10k / s for memory
        // 5k / s for disk
        console.log({
          idx,
          block: log.blockNumber,
        });

        const event = reducer.iface.parseLog(log);
        const eventHandler = reducer.eventHandlers.find(
          (e) => e.signature === event.signature
        );

        const loadedEntities = [];
        try {
          await eventHandler.handle(
            makeStorageHandleWithStagingArea(
              entityBlockStagingArea,
              store,
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
        entityBlockStagingArea
      );
    }
  }

  const totalEntries = new Map<string, any>();

  // for backfilling, process all entities at the end. this avoids writing and
  // overwriting the index but makes the reducers accessing values through the
  // index not possible.
  for await (const entity of store.getEntities()) {
    const entries = makeIndexEntries(entity, reducer);
    concatMaps(totalEntries, new Map(entries));
  }

  // todo: handle multiple storage areas for multiple indexers
  await store.updateFinalizedBlock(lastFinalizedBlock, totalEntries);
}

async function main() {
  const level = new Level<string, any>("./data/state", {
    valueEncoding: "json",
  });
  const store = new LevelEntityStore(level);

  const reducer = optimismReducer;

  await processStoredLogs(store, reducer);

  const provider = new ethers.providers.AlchemyProvider(
    "optimism",
    process.env.ALCHEMY_API_KEY
  );

  const blockProvider = new BlockProviderImpl(provider);

  const parents = new Map<string, BlockIdentifier>();
  const stagedEntitiesStorage = new Map<string, Map<string, any>>();
  const signatures = reducer.eventHandlers.map((handler) => handler.signature);
  const topics = topicsForSignatures(reducer.iface, signatures);
  const filter = filterForEventHandlers(reducer, signatures);

  async function ensureParentsAvailable(
    hash: string,
    latestBlockHeight: number,
    reducer: IndexerDefinition<any, any>,
    depth: number
  ) {
    if (isBlockDepthFinalized(depth)) {
      return;
    }

    const parentBlock = parents.get(hash);
    if (parentBlock) {
      return await ensureParentsAvailable(
        parentBlock.hash,
        latestBlockHeight,
        reducer,
        depth + 1
      );
    }

    const block = await blockProvider.getBlockByHash(hash);

    await ensureParentsAvailable(
      block.parentHash,
      latestBlockHeight,
      reducer,
      depth + 1
    );

    await processBlock(block, latestBlockHeight, reducer);

    parents.set(block.hash, {
      hash: block.parentHash,
      blockNumber: block.number - 1,
    });
  }

  async function processBlock(
    block: BlockProviderBlock,
    latestBlockHeight: number,
    reducer: IndexerDefinition<any, any>,
    logsCache?: Map<string, ethers.providers.Log[]>
  ) {
    const nextBlockDepth = latestBlockHeight - block.number;

    const shouldCheckBlock = !!topics.find((topic) =>
      isTopicInBloom(block.logsBloom, topic)
    );
    if (shouldCheckBlock) {
      const logs =
        logsCache?.get(block.hash) ??
        (await provider.getLogs({
          blockHash: block.hash,
          ...filter,
        }));

      for (const log of logs) {
        const event = reducer.iface.parseLog(log);
        const eventHandler = reducer.eventHandlers.find(
          (e) => e.signature === event.signature
        );

        const { storageHandle, finalize } = (() => {
          if (isBlockDepthFinalized(nextBlockDepth)) {
            const stagingArea = new Map<string, any>();

            return {
              storageHandle: makeStorageHandleWithStagingArea(
                stagingArea,
                store
              ),
              finalize: () =>
                store.updateFinalizedBlock(
                  {
                    hash: block.hash,
                    blockNumber: block.number,
                  },
                  withIndexFields(stagingArea, reducer)
                ),
            };
          } else {
            return {
              storageHandle: makeStorageHandleForShallowBlocks(
                stagedEntitiesStorage,
                parents,
                block,
                latestBlockHeight,
                store
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

    store.updateFinalizedBlock(
      {
        hash: blockIdentifier.hash,
        blockNumber: blockIdentifier.blockNumber,
      },
      withIndexFields(storageArea, reducer)
    );
  }

  const entityStoreFinalizedBlock = await store.getFinalizedBlock();
  let nextBlockNumber = entityStoreFinalizedBlock
    ? entityStoreFinalizedBlock.blockNumber + 1
    : reducer.startingBlock;

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
    const logs = await provider.getLogs({
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
        reducer,
        latestBlock.number - nextBlock.number
      );

      await processBlock(nextBlock, latestBlock.number, reducer, logsCache);

      promoteFinalizedBlocks(latestBlock.number, nextBlock.hash);

      nextBlockNumber = nextBlock.number + 1;
    }
  }
}

main();

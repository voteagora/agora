import { ethers } from "ethers";
import { isBlockDepthFinalized, maxReorgBlocksDepth } from "../process";
import {
  BlockIdentifier,
  makeStorageHandleForShallowBlocks,
  makeStorageHandleWithStagingArea,
} from "../storageHandle";
import { EntityWithMetadata, LevelEntityStore } from "../entityStore";
import { isTopicInBloom } from "web3-utils";
import { BlockProviderBlock, BlockProviderImpl } from "../blockProvider";
import { collectGenerator, groupBy } from "../utils/generatorUtils";
import { timeout } from "../utils/asyncUtils";
import { indexers } from "../contracts";
import { EthersLogProvider, topicFilterForIndexers } from "../logProvider";

/**
 * Processes and writes updates for finalized blocks from stored logs.
 */
async function main() {
  const store = await LevelEntityStore.open();

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
            const stagingArea = new Map<string, EntityWithMetadata>();

            return {
              storageHandle: makeStorageHandleWithStagingArea(
                stagingArea,
                store,
                indexer
              ),
              finalize: async () =>
                await store.flushUpdates(
                  {
                    hash: block.hash,
                    blockNumber: block.number,
                  },
                  indexers,
                  stagingArea
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
      stagedEntitiesStorage.get(blockIdentifier.hash) ??
      new Map<string, EntityWithMetadata>();

    store.flushUpdates(blockIdentifier, indexers, storageArea);
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

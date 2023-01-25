import {
  combineEntities,
  EntityStore,
  EntityWithMetadata,
} from "./entityStore";
import { isTopicInBloom } from "web3-utils";
import {
  IndexerDefinition,
  isBlockDepthFinalized,
  maxReorgBlocksDepth,
} from "./process";
import {
  blockIdentifierFromBlock,
  blockIdentifierFromParentBlock,
  BlockProviderBlock,
  BlockProviderImpl,
  maxBlockRange,
} from "./blockProvider";
import { EthersLogProvider, topicFilterForIndexers } from "./logProvider";
import {
  BlockIdentifier,
  makeStorageHandleForShallowBlocks,
  makeStorageHandleWithStagingArea,
} from "./storageHandle";
import { timeout } from "./utils/asyncUtils";
import { collectGenerator, groupBy } from "./utils/generatorUtils";
import { ethers } from "ethers";
import { StructuredError } from "./utils/errorUtils";

export function followChain(
  store: EntityStore,
  indexers: IndexerDefinition[],
  provider: ethers.providers.AlchemyProvider
) {
  const blockProvider = new BlockProviderImpl(provider);
  const logProvider = new EthersLogProvider(provider);
  const entityDefinitions = combineEntities(indexers);

  const storageArea: StorageArea = {
    latestBlockNumber: null,
    tipBlock: null,
    blockStorageAreas: new Map(),
    parents: new Map(),
  };

  const filter = topicFilterForIndexers(indexers);
  const topics = filter.topics[0];

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
      const stagingArea = new Map<string, EntityWithMetadata>();

      const { storageHandle, finalize } = (() => {
        if (isBlockDepthFinalized(nextBlockDepth)) {
          return {
            storageHandle: makeStorageHandleWithStagingArea(
              stagingArea,
              store,
              entityDefinitions
            ),
            finalize: async () => {
              return await store.flushUpdates(
                blockIdentifierFromBlock(block),
                indexers,
                stagingArea
              );
            },
          };
        } else {
          return {
            storageHandle: makeStorageHandleForShallowBlocks(
              storageArea.blockStorageAreas,
              storageArea.parents,
              block,
              latestBlockHeight,
              store,
              entityDefinitions
            ),
            finalize: async () => {
              // nop, finalization for these blocks is handled during promotion
            },
          };
        }
      })();

      const logs =
        logsCache?.get(block.hash) ??
        (await logProvider.getLogs({
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

        try {
          await eventHandler.handle(storageHandle, event as any, log);
        } catch (e) {
          throw new StructuredError(
            {
              log,
              event,
              storageArea,
              nextBlockDepth,
            },
            e
          );
        }
      }

      await finalize();
    }
  }

  async function ensureParentsAvailable(
    hash: string,
    latestBlockHeight: number,
    depth: number
  ): Promise<void> {
    if (isBlockDepthFinalized(depth)) {
      return;
    }

    const parentBlock = storageArea.parents.get(hash);
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

    storageArea.parents.set(block.hash, blockIdentifierFromParentBlock(block));
  }

  function* pathBetween(
    nextBlock: BlockIdentifier,
    endBlockIdentifier: BlockIdentifier
  ): Generator<BlockIdentifier> {
    if (nextBlock.blockNumber === endBlockIdentifier.blockNumber) {
      if (nextBlock.hash !== endBlockIdentifier.hash) {
        throw new Error(
          "found path to blockNumber of endBlockIdentifier but hash mismatch"
        );
      }

      return;
    }

    yield nextBlock;

    const parentBlockIdentifier = storageArea.parents.get(nextBlock.hash);
    if (!parentBlockIdentifier) {
      throw new Error("cannot find parent block");
    }

    yield* pathBetween(parentBlockIdentifier, endBlockIdentifier);
  }

  async function promoteFinalizedBlocks(
    latestBlockNumber: number,
    nextBlock: BlockIdentifier,
    finalizedBlock: BlockIdentifier | null
  ) {
    if (!finalizedBlock) {
      throw new Error("finalizedBlock does not exist");
    }

    const path = Array.from(pathBetween(nextBlock, finalizedBlock));

    const chainToLastFinalizedBlock = path.reverse().filter((it) => {
      const depth = latestBlockNumber - it.blockNumber;
      return isBlockDepthFinalized(depth);
    });

    for (const block of chainToLastFinalizedBlock) {
      const entities =
        storageArea.blockStorageAreas.get(block.hash)?.entities ??
        new Map<string, EntityWithMetadata>();

      await store.flushUpdates(block, indexers, entities);
    }
  }

  (async () => {
    let nextBlockNumber = await (async () => {
      const initialFinalizedBlock = await store.getFinalizedBlock();

      return initialFinalizedBlock
        ? initialFinalizedBlock.blockNumber + 1
        : indexers.reduce(
            (acc, it) => Math.min(it.startingBlock, acc),
            indexers[0].startingBlock
          );
    })();

    while (true) {
      const latestBlock = await blockProvider.getLatestBlock();
      storageArea.latestBlockNumber = latestBlock.number;

      if (latestBlock.number <= nextBlockNumber) {
        console.log("at tip!");
        // we're ahead of the tip, continue
        await timeout(1000);
        continue;
      }

      const fetchTill = Math.min(
        latestBlock.number,
        nextBlockNumber + maxBlockRange
      );

      const blocks = await blockProvider.getBlockRange(
        nextBlockNumber,
        fetchTill
      );

      const fetchLogsCacheTill = Math.max(
        Math.min(
          latestBlock.number - maxReorgBlocksDepth - 1,
          nextBlockNumber + maxBlockRange
        ),
        nextBlockNumber
      );
      const logs = await logProvider.getLogs({
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
        // update storageArea.tipBlock
        if (
          !storageArea.tipBlock ||
          nextBlock.number > storageArea.tipBlock.blockNumber
        ) {
          storageArea.tipBlock = blockIdentifierFromBlock(nextBlock);
        }

        storageArea.parents.set(
          nextBlock.hash,
          blockIdentifierFromParentBlock(nextBlock)
        );

        return;

        await ensureParentsAvailable(
          nextBlock.hash,
          latestBlock.number,
          latestBlock.number - nextBlock.number
        );

        await processBlock(nextBlock, latestBlock.number, logsCache);

        // const finalizedBlock = await store.getFinalizedBlock();
        // await promoteFinalizedBlocks(
        //   latestBlock.number,
        //   blockIdentifierFromBlock(nextBlock),
        //   finalizedBlock
        // );

        nextBlockNumber = nextBlock.number + 1;
      }
    }
  })();

  return storageArea;
}

export type StorageArea = {
  /**
   * Block considered to be the canonical chain tip. This is what queries will
   * be resolved against.
   */
  tipBlock: BlockIdentifier | null;

  /**
   * Highest block known to be mined. Used to determine whether a block number
   * is finalized or not.
   */
  latestBlockNumber: number | null;

  /**
   * Mapping from current block hash to parent block information. Used to
   * maintain lineage in the face of reorgs.
   */
  parents: Map<string, BlockIdentifier>;

  /**
   * A storage area associated with each block. Saved entities are made
   * available here.
   */
  blockStorageAreas: Map<string, BlockStorageArea>;
};

export type BlockStorageArea = {
  entities: Map<string, EntityWithMetadata>;
};

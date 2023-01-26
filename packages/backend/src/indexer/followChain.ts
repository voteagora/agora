import {
  combineEntities,
  EntityStore,
  EntityWithMetadata,
} from "./entityStore";
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
import { EthersLogProvider, Log, topicFilterForIndexers } from "./logProvider";
import {
  BlockIdentifier,
  makeStorageHandleForStorageArea,
} from "./storageHandle";
import { timeout } from "./utils/asyncUtils";
import { collectGenerator, groupBy } from "./utils/generatorUtils";
import { ethers } from "ethers";
import { StructuredError } from "./utils/errorUtils";
import * as serde from "./serde";

export async function followChain(
  store: EntityStore,
  indexers: IndexerDefinition[],
  provider: ethers.providers.JsonRpcProvider
) {
  const blockProvider = new BlockProviderImpl(provider);
  const logProvider = new EthersLogProvider(provider);
  const entityDefinitions = combineEntities(indexers);

  const storageArea: StorageArea = {
    latestBlockNumber: null,
    finalizedBlock: await (async () => {
      const finalizedBlock = await store.getFinalizedBlock();
      if (!finalizedBlock) {
        throw new Error("run backfill first");
      }

      return finalizedBlock;
    })(),
    tipBlock: null,
    blockStorageAreas: new Map(),
    parents: new Map(),
  };

  const filter = topicFilterForIndexers(indexers);
  const topics = filter.topics[0];

  async function processBlock(
    block: BlockProviderBlock,
    logsCache?: Map<string, Log[]>
  ) {
    const storageHandle = await makeStorageHandleForStorageArea(
      storageArea,
      block,
      store,
      entityDefinitions
    );
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
        await eventHandler.handle(
          storageHandle,
          event as any,
          logsSerde.deserialize(log)
        );
      } catch (e) {
        throw new StructuredError(
          {
            log,
            event,
            storageArea,
          },
          e
        );
      }
    }
  }

  async function ensureParentsAvailable(block: BlockIdentifier): Promise<void> {
    if (block.blockNumber === storageArea.finalizedBlock.blockNumber) {
      if (block.hash !== storageArea.finalizedBlock.hash) {
        throw new Error(`reorg deeper than ${maxReorgBlocksDepth}`);
      }

      return;
    }

    const parentBlockIdentifier = storageArea.parents.get(block.hash);
    if (parentBlockIdentifier) {
      return;
    }

    const parentBlock = await blockProvider.getBlockByHash(block.hash);

    await ensureParentsAvailable(blockIdentifierFromParentBlock(parentBlock));

    storageArea.parents.set(
      parentBlock.hash,
      blockIdentifierFromParentBlock(parentBlock)
    );

    await processBlock(parentBlock);
  }

  function* pathBetween(
    nextBlock: BlockIdentifier,
    endBlockIdentifier: BlockIdentifier
  ): Generator<BlockIdentifier> {
    let block = nextBlock;

    while (true) {
      if (block.blockNumber === endBlockIdentifier.blockNumber) {
        if (block.hash !== endBlockIdentifier.hash) {
          throw new Error(
            "found path to blockNumber of endBlockIdentifier but hash mismatch"
          );
        }

        return;
      }

      yield block;

      const parentBlockIdentifier = storageArea.parents.get(block.hash);
      if (!parentBlockIdentifier) {
        throw new Error("cannot find parent block");
      }

      block = parentBlockIdentifier;
    }
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

      storageArea.finalizedBlock = block;
      await store.flushUpdates(block, indexers, entities);
    }
  }

  const _ = (async () => {
    let nextBlockNumber = storageArea.finalizedBlock.blockNumber + 1;

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
          (log) => log.blockHash
        )
      );

      const logsCache = new Map([
        ...blocks.flatMap<[string, Log[]]>((block) => {
          const depth = latestBlock.number - block.number;
          if (!isBlockDepthFinalized(depth)) {
            return [];
          }

          return [[block.hash, []]];
        }),
        ...groupedLogs.map<[string, Log[]]>((it) => [it[0].blockHash, it]),
      ]);

      console.log({
        blocks: blocks.length,
        startingBlock: blocks[0].number,
        endingBlock: blocks[blocks.length - 1].number,
        depth: latestBlock.number - nextBlockNumber,
      });

      for (const nextBlock of blocks) {
        await ensureParentsAvailable(blockIdentifierFromParentBlock(nextBlock));

        storageArea.parents.set(
          nextBlock.hash,
          blockIdentifierFromParentBlock(nextBlock)
        );

        await processBlock(nextBlock, logsCache);

        await promoteFinalizedBlocks(
          latestBlock.number,
          blockIdentifierFromBlock(nextBlock),
          storageArea.finalizedBlock
        );

        // update storageArea.tipBlock
        if (
          !storageArea.tipBlock ||
          nextBlock.number > storageArea.tipBlock.blockNumber
        ) {
          storageArea.tipBlock = blockIdentifierFromBlock(nextBlock);
        }

        nextBlockNumber = nextBlock.number + 1;
      }
    }
  })();

  return storageArea;
}

export type StorageArea = {
  /**
   * Highest block processed. Considered to be the canonical chain tip. This is
   * what queries will be resolved against.
   */
  tipBlock: BlockIdentifier | null;

  /**
   * The highest finalized block saved to disk.
   */
  finalizedBlock: BlockIdentifier;

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

const logsSerde: serde.De<ethers.providers.Log, Log> = serde.objectDe({
  blockNumber: serde.bigNumberParseNumber,
  blockHash: serde.string,
  transactionIndex: serde.bigNumberParseNumber,
  removed: serde.constantDe(false),
  address: serde.string,
  data: serde.string,
  topics: serde.array(serde.string),
  transactionHash: serde.string,
  logIndex: serde.bigNumberParseNumber,
});

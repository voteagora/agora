import { ethers } from "ethers";

import {
  asyncIterableFromIterable,
  collectGenerator,
  groupBy,
} from "../../utils/generatorUtils";
import { StructuredError } from "../../utils/errorUtils";
import {
  blockIdentifierFromBlock,
  blockIdentifierFromParentBlock,
  BlockProvider,
  BlockProviderBlock,
  maxBlockRange,
} from "../blockProvider/blockProvider";
import { LogProvider } from "../logProvider/logProvider";
import {
  EntityWithMetadata,
  EntityStore,
  ReadOnlyEntityStore,
} from "../storage/entityStore/entityStore";
import { EntityDefinitions } from "../storage/reader/type";

import {
  BlockIdentifier,
  makeStorageHandleForStorageArea,
  pathBetween,
} from "./storageHandle";
import {
  isBlockDepthFinalized,
  makeLogProcessor,
  maxReorgBlocksDepth,
} from "./process";
import { IndexerDefinition } from "./indexerDefinition";
import { topicFilterForIndexers } from "./topicFilters";

export type FollowChainResultType =
  | {
      type: "TIP";
    }
  | {
      type: "MORE";
      depth: number;
      nextBlock: number;
    };

export function followChain(
  store: EntityStore,
  indexers: IndexerDefinition[],
  entityDefinitions: EntityDefinitions,
  blockProvider: BlockProvider,
  logProvider: LogProvider,
  storageArea: StorageArea,
  finalizationEnabled: boolean = true
) {
  const filter = topicFilterForIndexers(indexers);

  async function processBlock(
    block: BlockProviderBlock,
    logsCache?: Map<string, ethers.providers.Log[]>
  ) {
    const storageHandle = makeStorageHandleForStorageArea(
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
      const { eventAbi, handler, args } = makeLogProcessor(indexers, log);

      try {
        await handler.handle(storageHandle, args, log);
      } catch (e) {
        throw new StructuredError(
          {
            log,
            eventArgs: args,
            eventAbi: eventAbi,
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

    addToParents(storageArea.parents, parentBlock);

    await processBlock(parentBlock);
  }

  async function promoteFinalizedBlocks(
    latestBlockNumber: number,
    nextBlock: BlockIdentifier,
    finalizedBlock: BlockIdentifier | null
  ) {
    if (!finalizedBlock) {
      throw new Error("finalizedBlock does not exist");
    }

    const path = Array.from(
      pathBetween(nextBlock, finalizedBlock, storageArea.parents)
    );

    const chainToLastFinalizedBlock = path.reverse().filter((it) => {
      const depth = latestBlockNumber - it.blockNumber;
      return isBlockDepthFinalized(depth);
    });

    for (const block of chainToLastFinalizedBlock) {
      await store.flushUpdates(
        block,
        entityDefinitions,
        Array.from(
          storageArea.blockStorageAreas.get(block.hash)?.entities?.values() ??
            []
        )
      );

      // todo: there is likely some race condition leading to some correctness bug
      storageArea.finalizedBlock = block;
      storageArea.parents.delete(block.hash);
      storageArea.blockStorageAreas.delete(block.hash);
    }
  }

  let nextBlockNumber = storageArea.finalizedBlock.blockNumber + 1;

  return async (): Promise<FollowChainResultType> => {
    const latestBlock = await blockProvider.getLatestBlock();

    if (nextBlockNumber > latestBlock.number) {
      return {
        type: "TIP" as const,
      };
    }

    const nextBlock = await blockProvider.getBlockByNumber(nextBlockNumber);
    if (!nextBlock) {
      throw new Error("block not found");
    }

    const logs = await logProvider.getLogs({
      ...filter,
      fromBlock: nextBlockNumber,
      toBlock: nextBlockNumber,
    });

    const logsCache = await makeLogsCache(logs, [nextBlock]);

    await ensureParentsAvailable(blockIdentifierFromParentBlock(nextBlock));

    addToParents(storageArea.parents, nextBlock);

    await processBlock(nextBlock, logsCache);

    if (finalizationEnabled) {
      await promoteFinalizedBlocks(
        latestBlock.number,
        blockIdentifierFromBlock(nextBlock),
        storageArea.finalizedBlock
      );
    }

    // update storageArea.tipBlock
    if (
      !storageArea.tipBlock ||
      nextBlock.number > storageArea.tipBlock.blockNumber
    ) {
      storageArea.tipBlock = blockIdentifierFromBlock(nextBlock);
    }

    nextBlockNumber = nextBlock.number + 1;

    return {
      type: "MORE" as const,
      depth: latestBlock.number - nextBlockNumber,
      nextBlock: nextBlockNumber,
    };
  };
}

export async function makeInitialStorageArea(
  store: ReadOnlyEntityStore
): Promise<StorageArea> {
  return {
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

function addToParents(
  parents: Map<string, BlockIdentifier>,
  block: BlockProviderBlock
) {
  parents.set(block.hash, blockIdentifierFromParentBlock(block));
}

function* pathBetweenInclusive(
  nextBlock: BlockIdentifier,
  endBlockIdentifier: BlockIdentifier,
  parents: ReadonlyMap<string, BlockIdentifier>
) {
  let hasAtLeastOneItem = false;
  for (const node of pathBetween(nextBlock, endBlockIdentifier, parents)) {
    yield node;
    hasAtLeastOneItem = true;
  }

  if (hasAtLeastOneItem) {
    yield endBlockIdentifier;
  }
}

/**
 * Creates a mapping of blockHash to logs. Tries to fill in the blank entries
 * for blocks which are known to not have related logs without making
 * assumptions about consistency between {@link blocks} and {@link logs}.
 *
 * {@link blocks} and {@link logs} should both be internally consistent with
 * themselves. Some checks are done to validate this but the checks are not
 * complete.
 */
export async function makeLogsCache(
  logs: ethers.providers.Log[],
  blocks: BlockProviderBlock[]
): Promise<Map<string, ethers.providers.Log[]>> {
  const parents = new Map<string, BlockIdentifier>();

  for (const block of blocks) {
    addToParents(parents, block);
  }

  if (blocks.length) {
    /**
     * ensure blocks is internally consistent with itself. concretely there is
     * a path from the last block in the group to the first block. extra blocks
     * are allowed and this does not verify ordering
     * ({@link BlockProvider#getBlockRange} is responsible for that).
     */
    Array.from(
      pathBetween(
        blockIdentifierFromBlock(blocks[blocks.length - 1]),
        blockIdentifierFromBlock(blocks[0]),
        parents
      )
    );
  }

  const groupedLogs = await collectGenerator(
    groupBy(asyncIterableFromIterable(logs), (log) => log.blockHash)
  );

  const groupedLogsWithBlock = groupedLogs.map((logs) => {
    const block: BlockIdentifier = {
      blockNumber: logs[0].blockNumber,
      hash: logs[0].blockHash,
    };

    return {
      logs: logs,
      block,
    };
  });

  const logsPath = !groupedLogsWithBlock.length
    ? []
    : [
        ...Array.from(
          pathBetweenInclusive(
            groupedLogsWithBlock[groupedLogsWithBlock.length - 1].block,
            groupedLogsWithBlock[0].block,
            parents
          )
        ),
      ];

  const value = new Map([
    ...((): [string, ethers.providers.Log[]][] => {
      if (!groupedLogsWithBlock.length) {
        return [];
      }

      return logsPath.map((it) => [it.hash, []]);
    })(),
    ...groupedLogs.map<[string, ethers.providers.Log[]]>((it) => [
      it[0].blockHash,
      it,
    ]),
  ]);

  return value;
}

export function isResultFinal(result: FollowChainResultType) {
  switch (result.type) {
    case "TIP":
      return true;

    case "MORE":
      return result.depth <= maxReorgBlocksDepth;
  }
}

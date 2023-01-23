import { EntityWithMetadata, ReadOnlyEntityStore } from "./entityStore";
import { blockIdentifierFromBlock, BlockProviderBlock } from "./blockProvider";
import { getOrInsert } from "./utils/mapUtils";
import { IndexerDefinition, isBlockDepthFinalized } from "./process";
import { makeEntityKey } from "./entityKey";
import { StorageArea } from "./followChain";

export type ReadableStorageHandle<Entities> = {
  loadEntity<Entity extends keyof Entities & string>(
    entity: Entity,
    id: string
  ): Promise<Entities[Entity] | null>;
};

export type WritableStorageHandle<Entities> = {
  saveEntity<Entity extends keyof Entities & string>(
    entity: Entity,
    id: string,
    value: Entities[Entity]
  ): void;
};

export type StorageHandle<Entities> = ReadableStorageHandle<Entities> &
  WritableStorageHandle<Entities>;

export type BlockIdentifier = {
  blockNumber: number;
  hash: string;
};

export function coerceLevelDbNotfoundError<T>(
  promise: Promise<T>
): Promise<T | null> {
  return promise.catch((err) => {
    if (err.code === "LEVEL_NOT_FOUND") {
      return null;
    } else {
      throw err;
    }
  });
}

type LineageNode =
  | {
      type: "BLOCK";
      blockIdentifier: BlockIdentifier;
    }
  | {
      type: "FINALIZED";
    };

export function* generateLineagePath(
  startingBlock: BlockIdentifier,
  parents: ReadonlyMap<string, BlockIdentifier>,
  latestBlockHeight: number
): Generator<LineageNode> {
  let blockHash = startingBlock.hash;

  yield {
    type: "BLOCK",
    blockIdentifier: startingBlock,
  };

  while (true) {
    const parentBlock = parents.get(blockHash);
    if (!parentBlock) {
      throw new Error(
        `cannot establish lineage from ${startingBlock.hash} to finalized region. failed to find parent of ${blockHash}`
      );
    }

    const parentBlockDepth = latestBlockHeight - parentBlock.blockNumber;
    if (isBlockDepthFinalized(parentBlockDepth)) {
      yield {
        type: "FINALIZED",
      };
      return;
    }

    blockHash = parentBlock.hash;
  }
}

/**
 * A storage handle where writes are tracked on a per-block staging area. Reads
 * walk up the parent graph looking for the entity in each block's staging
 * area. After maxReorgBlocksDepth blocks, reads from ReadOnlyEntityStore.
 */
export function makeStorageHandleForShallowBlocks(
  stagedEntitiesStorage: StorageArea["blockStorageAreas"],
  parents: ReadonlyMap<string, BlockIdentifier>,
  block: BlockProviderBlock,
  latestBlockHeight: number,
  store: ReadOnlyEntityStore,
  indexer: IndexerDefinition
): StorageHandle<any> {
  return {
    saveEntity(entity: string, id: string, value: any): void {
      const blockStagingArea = getOrInsert(
        stagedEntitiesStorage,
        block.hash,
        () => ({
          entities: new Map(),
        })
      );

      blockStagingArea.entities.set(makeEntityKey(entity, id), {
        id,
        entity,
        value,
      });
    },

    async loadEntity(entity: string, id: string): Promise<any | null> {
      for (const node of generateLineagePath(
        blockIdentifierFromBlock(block),
        parents,
        latestBlockHeight
      )) {
        switch (node.type) {
          case "BLOCK": {
            const stagingArea = stagedEntitiesStorage.get(
              node.blockIdentifier.hash
            );
            if (stagingArea) {
              const key = makeEntityKey(entity, id);
              const hasValue = stagingArea.entities.has(key);
              if (hasValue) {
                const fromStaging = stagingArea.entities.get(key)!;
                return fromStaging.value;
              }
            }

            break;
          }

          case "FINALIZED": {
            const fromStore = await store.getEntity(entity, id);
            if (!fromStore) {
              return fromStore;
            }

            return indexer.entities[entity].serde.deserialize(fromStore);
          }
        }
      }

      return null;
    },
  };
}

/**
 * A storage handle where writes are held in a staging area and reads first
 * check the staging area before checking the ReadOnlyEntityStore.
 */
export function makeStorageHandleWithStagingArea(
  stagingArea: Map<string, EntityWithMetadata>,
  store: ReadOnlyEntityStore,
  indexer: IndexerDefinition,
  loadedEntities?: EntityWithMetadata[]
): StorageHandle<any> {
  return {
    saveEntity(entity: string, id: string, value: unknown): void {
      stagingArea.set(makeEntityKey(entity, id), {
        entity,
        id,
        value,
      });
    },
    async loadEntity(entity: string, id: string): Promise<any | null> {
      const value = await (async () => {
        const key = makeEntityKey(entity, id);
        if (stagingArea.has(key)) {
          const fromStagingArea = stagingArea.get(key)!;
          return fromStagingArea.value;
        }

        const fromStore = await store.getEntity(entity, id);
        if (!fromStore) {
          return fromStore;
        }

        return indexer.entities[entity].serde.deserialize(fromStore);
      })();

      if (loadedEntities) {
        loadedEntities.push({
          entity,
          id,
          value,
        });
      }

      return value;
    },
  };
}

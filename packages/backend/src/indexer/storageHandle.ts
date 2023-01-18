import { EntityWithMetadata, ReadOnlyEntityStore } from "./entityStore";
import { BlockProviderBlock } from "./blockProvider";
import { getOrInsert } from "./utils/mapUtils";
import { isBlockDepthFinalized } from "./process";
import { makeEntityKey } from "./keys";

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

/**
 * A storage handle where writes are tracked on a per-block staging area. Reads
 * walk up the parent graph looking for the entity in each block's staging
 * area. After maxReorgBlocksDepth blocks, reads from ReadOnlyEntityStore.
 */
export function makeStorageHandleForShallowBlocks(
  stagedEntitiesStorage: Map<string, Map<string, any>>,
  parents: ReadonlyMap<string, BlockIdentifier>,
  block: BlockProviderBlock,
  latestBlockHeight: number,
  store: ReadOnlyEntityStore
): StorageHandle<any> {
  return {
    saveEntity(entity: string, id: string, value: any): void {
      const blockStagingArea = getOrInsert(
        stagedEntitiesStorage,
        block.hash,
        () => new Map()
      );

      blockStagingArea.set(makeEntityKey(entity, id), value);
    },

    async loadEntity(entity: string, id: string): Promise<any | null> {
      let blockHash = block.hash;

      while (true) {
        const stagingArea = stagedEntitiesStorage.get(blockHash);
        if (stagingArea) {
          const key = makeEntityKey(entity, id);
          const hasValue = stagingArea.has(key);
          if (hasValue) {
            return stagingArea.get(key);
          }
        }

        const parentBlock = parents.get(blockHash);
        if (!parentBlock) {
          throw new Error(
            `cannot establish lineage from ${block.hash} to finalized region. failed to find parent of ${blockHash}`
          );
        }

        const parentBlockDepth = latestBlockHeight - parentBlock.blockNumber;
        if (isBlockDepthFinalized(parentBlockDepth)) {
          return await store.getEntity(entity, id);
        }

        blockHash = parentBlock.hash;
      }
    },
  };
}

/**
 * A storage handle where writes are held in a staging area and reads first
 * check the staging area before checking the ReadOnlyEntityStore.
 */
export function makeStorageHandleWithStagingArea(
  stagingArea: Map<string, any>,
  store: ReadOnlyEntityStore,
  loadedEntities?: EntityWithMetadata[]
): StorageHandle<any> {
  return {
    saveEntity(entity: string, id: string, value: any): void {
      stagingArea.set(makeEntityKey(entity, id), value);
    },
    async loadEntity(entity: string, id: string): Promise<any | null> {
      const value = await (async () => {
        const key = makeEntityKey(entity, id);
        if (stagingArea.has(key)) {
          return stagingArea.get(key);
        }

        return await store.getEntity(entity, id);
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

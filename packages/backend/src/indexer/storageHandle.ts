import { EntityWithMetadata, ReadOnlyEntityStore } from "./entityStore";
import { blockIdentifierFromBlock, BlockProviderBlock } from "./blockProvider";
import { getOrInsert } from "./utils/mapUtils";
import { makeEntityKey } from "./entityKey";
import { StorageArea } from "./followChain";
import { EntityDefinitions } from "./reader";
import { cloneSerdeValue } from "./serde";

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
  finalizedBlock: BlockIdentifier,
  parents: ReadonlyMap<string, BlockIdentifier>
): Generator<LineageNode> {
  let block = startingBlock;

  while (true) {
    if (block.blockNumber === finalizedBlock.blockNumber) {
      if (block.hash !== finalizedBlock.hash) {
        throw new Error("unable to track lineage");
      }

      yield {
        type: "FINALIZED",
      };

      return;
    }

    yield {
      type: "BLOCK",
      blockIdentifier: block,
    };

    const parentBlock = parents.get(block.hash);
    if (!parentBlock) {
      throw new Error(
        `cannot establish lineage from ${block.hash} to finalized region. failed to find parent of ${block.hash}`
      );
    }

    block = parentBlock;
  }
}

/**
 * A storage handle where writes are tracked on a per-block staging area. Reads
 * walk up the parent graph looking for the entity in each block's staging
 * area. After maxReorgBlocksDepth blocks, reads from ReadOnlyEntityStore.
 */
export async function makeStorageHandleForStorageArea(
  storageArea: StorageArea,
  block: BlockProviderBlock,
  store: ReadOnlyEntityStore,
  entityDefinitions: EntityDefinitions
): Promise<StorageHandle<any>> {
  return {
    saveEntity(entity: string, id: string, value: any): void {
      const blockStagingArea = getOrInsert(
        storageArea.blockStorageAreas,
        block.hash,
        () => ({
          entities: new Map(),
        })
      );

      blockStagingArea.entities.set(
        makeEntityKey(entity, id),
        Object.freeze({
          id,
          entity,
          value,
        })
      );
    },

    async loadEntity(entity: string, id: string): Promise<any | null> {
      const entityDefinition = entityDefinitions[entity];
      for (const node of generateLineagePath(
        blockIdentifierFromBlock(block),
        storageArea.finalizedBlock,
        storageArea.parents
      )) {
        switch (node.type) {
          case "BLOCK": {
            const stagingArea = storageArea.blockStorageAreas.get(
              node.blockIdentifier.hash
            );
            if (!stagingArea) {
              continue;
            }

            const key = makeEntityKey(entity, id);
            const hasValue = stagingArea.entities.has(key);
            if (!hasValue) {
              continue;
            }

            const fromStaging = stagingArea.entities.get(key)!;

            return cloneSerdeValue(entityDefinition.serde, fromStaging.value);
          }

          case "FINALIZED": {
            const fromStore = await store.getEntity(entity, id);
            if (!fromStore) {
              return fromStore;
            }

            return entityDefinition.serde.deserialize(fromStore);
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
  entityDefinitions: EntityDefinitions,
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

        return entityDefinitions[entity].serde.deserialize(fromStore);
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

import { EntityWithMetadata, ReadOnlyEntityStore } from "./storage/entityStore";
import { blockIdentifierFromBlock, BlockProviderBlock } from "./blockProvider";
import { getOrInsert } from "./utils/mapUtils";
import { makeEntityKey } from "./entityKey";
import { StorageArea } from "./followChain";
import { EntityDefinitions } from "./storage/reader";
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

/**
 * Traverses parents emitting blocks from nextBlock inclusive to
 * endBlockIdentifier exclusive.
 */
export function* pathBetween(
  nextBlock: BlockIdentifier,
  endBlockIdentifier: BlockIdentifier,
  parents: ReadonlyMap<string, BlockIdentifier>
): Generator<BlockIdentifier> {
  if (!(endBlockIdentifier.blockNumber <= nextBlock.blockNumber)) {
    throw new Error(
      "pathBetween requires the endBlockIdentifier have a block number be less " +
        "than or equal to nextBlock"
    );
  }

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

    const parentBlockIdentifier = parents.get(block.hash);
    if (!parentBlockIdentifier) {
      throw new Error("cannot find parent block");
    }

    block = parentBlockIdentifier;
  }
}

type LoadedEntity = {
  entity: EntityWithMetadata;
  source: EntitySource;
};

type EntitySource =
  | {
      type: "BLOCK";
      resolvedBlock: BlockIdentifier;
      tipBlock: BlockIdentifier;
      finalizedBlock: BlockIdentifier;
    }
  | {
      type: "STORE";
      tipBlock: BlockIdentifier;
      finalizedBlock: BlockIdentifier;
    };

/**
 * A storage handle where writes are tracked on a per-block staging area. Reads
 * walk up the parent graph looking for the entity in each block's staging
 * area. After maxReorgBlocksDepth blocks, reads from ReadOnlyEntityStore.
 */
export function makeStorageHandleForStorageArea(
  storageArea: StorageArea,
  block: BlockProviderBlock,
  store: ReadOnlyEntityStore,
  entityDefinitions: EntityDefinitions
): [StorageHandle<any>, LoadedEntity[]] {
  const loadedEntities: LoadedEntity[] = [];

  return [
    {
      saveEntity(entity: string, id: string, value: any): void {
        const blockStagingArea = getOrInsert(
          storageArea.blockStorageAreas,
          block.hash,
          () => ({
            entities: new Map(),
          })
        );

        console.log({
          write: {
            block,
            entity,
            id,
            value,
            t: (value as any)["tokensRepresented"]?.toString(),
          },
        });

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
        const tipBlock = blockIdentifierFromBlock(block);
        const finalizedBlock = storageArea.finalizedBlock;
        for (const blockIdentifier of pathBetween(
          tipBlock,
          finalizedBlock,
          storageArea.parents
        )) {
          const stagingArea = storageArea.blockStorageAreas.get(
            blockIdentifier.hash
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

          loadedEntities.push({
            entity: fromStaging,
            source: {
              type: "BLOCK",
              tipBlock,
              finalizedBlock,
              resolvedBlock: blockIdentifier,
            },
          });

          return cloneSerdeValue(entityDefinition.serde, fromStaging.value);
        }

        const fromStore = await store.getEntity(entity, id);
        if (!fromStore) {
          return fromStore;
        }

        loadedEntities.push({
          entity: {
            entity,
            id,
            value: fromStore,
          },
          source: {
            type: "STORE",
            tipBlock,
            finalizedBlock,
          },
        });

        return entityDefinition.serde.deserialize(fromStore);
      },
    },
    loadedEntities,
  ];
}

/**
 * A storage handle where writes are held in a staging area and reads first
 * check the staging area before checking the ReadOnlyEntityStore.
 */
export function makeStorageHandleWithStagingArea(
  stagingArea: Map<string, EntityWithMetadata>,
  store: ReadOnlyEntityStore,
  entityDefinitions: EntityDefinitions
): [StorageHandle<any>, EntityWithMetadata[]] {
  const loadedEntities: EntityWithMetadata[] = [];

  return [
    {
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
    },
    loadedEntities,
  ];
}

import { getOrInsert } from "../../utils/mapUtils";
import {
  blockIdentifierFromBlock,
  BlockProviderBlock,
} from "../blockProvider/blockProvider";
import { makeEntityKey } from "../storage/keys/entityKey";
import { makeReader } from "../storage/reader/reader";
import { RuntimeType } from "../serde";
import {
  EntityWithMetadata,
  ReadOnlyEntityStore,
} from "../storage/entityStore/entityStore";
import { EntityDefinitions, ReaderEntities } from "../storage/reader/type";

import { StorageArea } from "./followChain";

export type WritableStorageHandle<
  EntityDefinitionsType extends EntityDefinitions
> = {
  entityDefinitions: EntityDefinitionsType;

  saveEntity<Entity extends keyof EntityDefinitionsType & string>(
    entity: Entity,
    id: string,
    value: RuntimeType<EntityDefinitionsType[Entity]["serde"]>
  ): void;
};

export type StorageHandle<EntityDefinitionsType extends EntityDefinitions> =
  WritableStorageHandle<EntityDefinitionsType> &
    ReaderEntities<EntityDefinitionsType> & {
      entityDefinitions: EntityDefinitionsType;
    };

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

export function mapEntriesForEntity<T = unknown>(
  entityWithMetadata: EntityWithMetadata<T>
): [string, EntityWithMetadata<T>] {
  const { entity, id } = entityWithMetadata;

  return [makeEntityKey(entity, id), entityWithMetadata];
}

export function setMapEntries<K, V>(map: Map<K, V>, [key, value]: [K, V]) {
  map.set(key, value);
}

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
): StorageHandle<any> {
  const reader = makeReader(
    store,
    storageArea,
    entityDefinitions,
    blockIdentifierFromBlock(block)
  );

  return {
    entityDefinitions,
    saveEntity(entity: string, id: string, value: any): void {
      const blockStagingArea = getOrInsert(
        storageArea.blockStorageAreas,
        block.hash,
        () => ({
          entities: new Map(),
        })
      );

      setMapEntries(
        blockStagingArea.entities,
        mapEntriesForEntity(Object.freeze({ id, entity, value }))
      );
    },

    getEntity: reader.getEntity,
  };
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
      entityDefinitions,
      saveEntity(entity: string, id: string, value: unknown): void {
        setMapEntries(
          stagingArea,
          mapEntriesForEntity({
            entity,
            id,
            value,
          })
        );
      },
      async getEntity(entity: string, id: string): Promise<any | null> {
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

import Heap from "heap";

import * as serde from "../../serde";
import { RuntimeType } from "../../serde";
import { StorageArea } from "../../process/followChain";
import { BlockIdentifier, pathBetween } from "../../process/storageHandle";
import { compareBy } from "../../../utils/sortUtils";
import { makeEntityKey } from "../keys/entityKey";
import { makeIndexKey } from "../keys/indexKey";
import { IndexQueryArgs, resolveIndexQueryArgs } from "../indexQueryArgs";
import { ReadOnlyEntityStore } from "../entityStore/entityStore";

import { EntityDefinitions, IndexedValue, Reader } from "./type";

export type LookupValue<T> = {
  value: T;
} | null;

export function getEntityFromStorageArea<
  EntityDefinitionsType extends EntityDefinitions,
  Entity extends keyof EntityDefinitionsType & string
>(
  storageArea: StorageArea,
  entity: Entity,
  entityDefinition: EntityDefinitionsType[Entity],
  id: string,
  tipBlock: BlockIdentifier | null
): LookupValue<RuntimeType<EntityDefinitionsType[Entity]["serde"]>> | null {
  if (!tipBlock) {
    return null;
  }

  if (!storageArea.finalizedBlock) {
    return null;
  }

  const lineagePath = pathBetween(
    tipBlock,
    storageArea.finalizedBlock,
    storageArea.parents
  );

  const key = makeEntityKey(entity, id);

  for (const blockIdentifier of lineagePath) {
    const blockStorageArea = storageArea.blockStorageAreas.get(
      blockIdentifier.hash
    );
    if (!blockStorageArea) {
      continue;
    }

    if (blockStorageArea.entities.has(key)) {
      const fromStorage = blockStorageArea.entities.get(key)!;
      return {
        value: serde.cloneSerdeValue(
          entityDefinition.serde,
          fromStorage.value as any
        ),
      };
    }
  }

  return null;
}

export async function* getEntitiesByIndexFromStorageArea<
  EntityDefinitionsType extends EntityDefinitions,
  Entity extends keyof EntityDefinitionsType & string,
  IndexName extends keyof EntityDefinitionsType[Entity]["indexes"] & string
>(
  entity: Entity,
  entityDefinition: EntityDefinitionsType[Entity],
  indexName: IndexName,
  args: IndexQueryArgs,
  storageArea: StorageArea,
  tipBlock: BlockIdentifier | null,
  makeGenerator?: (
    indexPrefix: string,
    startingKey: string,
    visitedValues: Set<string>
  ) => AsyncGenerator<
    IndexedValue<RuntimeType<EntityDefinitionsType[Entity]["serde"]>>
  >
): AsyncGenerator<
  IndexedValue<RuntimeType<EntityDefinitionsType[Entity]["serde"]>>
> {
  const indexDefinition = entityDefinition.indexes[indexName];

  type EntityValueType = RuntimeType<EntityDefinitionsType[Entity]["serde"]>;

  const { startingKey, indexPrefix } = resolveIndexQueryArgs(
    entity,
    indexName,
    args
  );

  type HeapValue =
    | {
        type: "VALUE";
        value: IndexedValue<EntityValueType>;
      }
    | {
        type: "GENERATOR";
        value: IndexedValue<EntityValueType>;
        generator: AsyncGenerator<IndexedValue<EntityValueType>>;
      };

  const heap = new Heap<HeapValue>(compareBy((it) => it.value.indexKey));

  const visitedValues = new Set<string>();

  if (tipBlock) {
    for (const blockIdentifier of pathBetween(
      tipBlock,
      storageArea.finalizedBlock,
      storageArea.parents
    )) {
      const blockStorageArea = storageArea.blockStorageAreas.get(
        blockIdentifier.hash
      );
      if (!blockStorageArea) {
        continue;
      }

      const entities = Array.from(blockStorageArea.entities.values())
        .filter((it) => it.entity === entity)
        .filter((it) => !visitedValues.has(it.id));

      const entitiesWithIndexValue = entities.map((entity) => ({
        id: entity.id,
        value: entity.value,
        indexKey: makeIndexKey(indexDefinition, indexName, entity),
      }));

      for (const { indexKey, id, value } of entitiesWithIndexValue) {
        visitedValues.add(id);

        if (indexKey < startingKey) {
          continue;
        }

        heap.push({
          type: "VALUE",
          value: {
            entityId: id,
            indexKey,
            value: serde.cloneSerdeValue(
              entityDefinition.serde,
              value
            ) as EntityValueType,
          },
        });
      }
    }
  }

  if (makeGenerator) {
    const baseGenerator = makeGenerator(
      indexPrefix,
      startingKey,
      visitedValues
    );

    const generator = (async function* () {
      for await (const item of baseGenerator) {
        if (visitedValues.has(item.entityId)) {
          continue;
        }

        visitedValues.add(item.entityId);

        yield item;
      }
    })();

    const nextValue = await generator.next();
    if (!nextValue.done) {
      heap.push({
        type: "GENERATOR",
        value: nextValue.value,
        generator: generator,
      });
    }
  }

  while (true) {
    const item = heap.pop();
    if (!item) {
      break;
    }

    if (!item.value.indexKey.startsWith(indexPrefix)) {
      break;
    }

    yield {
      entityId: item.value.entityId,
      indexKey: item.value.indexKey.split("|")[3],
      value: item.value.value,
    };

    switch (item.type) {
      case "VALUE": {
        break;
      }

      case "GENERATOR": {
        const nextValue = await item.generator.next();
        if (!nextValue.done) {
          heap.push({
            type: "GENERATOR",
            generator: item.generator,
            value: nextValue.value,
          });
        }
      }
    }
  }
}

export function makeReader<EntityDefinitionsType extends EntityDefinitions>(
  entityStore: ReadOnlyEntityStore,
  storageArea: StorageArea,
  entityDefinitions: EntityDefinitionsType,
  tipBlock: BlockIdentifier | null = storageArea.tipBlock
): Reader<EntityDefinitionsType> {
  return {
    entityDefinitions,

    async *getEntitiesByIndex<
      Entity extends keyof EntityDefinitionsType & string,
      IndexName extends keyof EntityDefinitionsType[Entity]["indexes"] & string
    >(
      entity: Entity,
      indexName: IndexName,
      args: IndexQueryArgs
    ): AsyncGenerator<
      IndexedValue<RuntimeType<EntityDefinitionsType[Entity]["serde"]>>
    > {
      const entityDefinition = entityDefinitions[entity];

      yield* getEntitiesByIndexFromStorageArea(
        entity,
        entityDefinition,
        indexName,
        args,
        storageArea,
        tipBlock,
        async function* (indexPrefix, startingKey, visitedValues) {
          for await (const {
            indexKey,
            entityId,
            value,
          } of entityStore.getEntities(
            entity,
            indexName,
            args,
            visitedValues
          )) {
            yield {
              indexKey,
              entityId,
              value: entityDefinition.serde.deserialize(value),
            };
          }
        }
      );
    },

    async getEntity<Entity extends keyof EntityDefinitionsType & string>(
      entity: Entity,
      id: string
    ): Promise<RuntimeType<EntityDefinitionsType[Entity]["serde"]> | null> {
      const entityDefinition = entityDefinitions[entity];
      const fromMemory = getEntityFromStorageArea(
        storageArea,
        entity,
        entityDefinition,
        id,
        tipBlock
      );
      if (fromMemory) {
        return fromMemory.value;
      }

      const fromStorage = await entityStore.getEntity(entity, id);
      if (!fromStorage) {
        return null;
      }

      return entityDefinition.serde.deserialize(fromStorage);
    },

    getLatestBlock(): BlockIdentifier {
      return tipBlock ?? storageArea.finalizedBlock;
    },
  };
}

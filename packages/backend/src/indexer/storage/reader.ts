import { EntityDefinition } from "../process";
import * as serde from "../serde";
import { RuntimeType } from "../serde";
import { StorageArea } from "../followChain";
import { pathBetween } from "../storageHandle";
import { makeEntityKey } from "../entityKey";
import { makeIndexKey, makeIndexKeyRaw, makeIndexPrefix } from "../indexKey";
import Heap from "heap";
import { compareBy } from "../utils/sortUtils";

export type EntityDefinitions = {
  [key: string]: EntityDefinition;
};

export type IndexQueryArgs =
  | {
      type: "EXACT_MATCH";
      indexKey: string;
    }
  | {
      type: "RANGE";
      starting?: {
        indexKey: string;
        entityId?: string;
      };
    };

export interface Reader<EntityDefinitionsType extends EntityDefinitions> {
  readonly entityDefinitions: EntityDefinitionsType;

  getEntity<Entity extends keyof EntityDefinitionsType & string>(
    entity: Entity,
    id: string
  ): Promise<Readonly<
    RuntimeType<EntityDefinitionsType[Entity]["serde"]>
  > | null>;

  getEntitiesByIndex<
    Entity extends keyof EntityDefinitionsType & string,
    IndexName extends EntityDefinitionsType[Entity]["indexes"][0]["indexName"]
  >(
    entity: Entity,
    indexName: IndexName,
    args: IndexQueryArgs
  ): AsyncGenerator<
    IndexedValue<Readonly<RuntimeType<EntityDefinitionsType[Entity]["serde"]>>>
  >;
}

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
  id: string
): LookupValue<RuntimeType<EntityDefinitionsType[Entity]["serde"]>> | null {
  if (!storageArea.tipBlock) {
    return null;
  }

  if (!storageArea.finalizedBlock) {
    return null;
  }

  const lineagePath = pathBetween(
    storageArea.tipBlock,
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

export type IndexedValue<T> = {
  entityId: string;
  indexKey: string;
  value: T;
};

export async function* getEntitiesByIndexFromStorageArea<
  EntityDefinitionsType extends EntityDefinitions,
  Entity extends keyof EntityDefinitionsType & string,
  IndexName extends EntityDefinitionsType[Entity]["indexes"][0]["indexName"]
>(
  entity: Entity,
  entityDefinition: EntityDefinitionsType[Entity],
  indexName: IndexName,
  args: IndexQueryArgs,
  storageArea: StorageArea,
  makeGenerator: (
    indexPrefix: string,
    startingKey: string,
    visitedValues: Set<string>
  ) => AsyncGenerator<
    IndexedValue<Readonly<RuntimeType<EntityDefinitionsType[Entity]["serde"]>>>
  >
): AsyncGenerator<
  IndexedValue<Readonly<RuntimeType<EntityDefinitionsType[Entity]["serde"]>>>
> {
  const indexDefinition = entityDefinition.indexes.find(
    (indexDefinition) => indexDefinition.indexName === indexName
  )!;

  type EntityValueType = Readonly<
    RuntimeType<EntityDefinitionsType[Entity]["serde"]>
  >;

  const { startingKey, indexPrefix } = (() => {
    switch (args.type) {
      case "EXACT_MATCH": {
        const indexPrefix = makeIndexKeyRaw(
          entity,
          indexName,
          args.indexKey,
          ""
        );
        return {
          indexPrefix,
          startingKey: indexPrefix,
        };
      }

      case "RANGE": {
        const indexPrefix = makeIndexPrefix(entity, indexName);

        if (args.starting) {
          return {
            indexPrefix,
            startingKey: makeIndexKeyRaw(
              entity,
              indexName,
              args.starting.indexKey,
              args.starting.entityId ?? ""
            ),
          };
        } else {
          return {
            indexPrefix: indexPrefix,
            startingKey: indexPrefix,
          };
        }
      }
    }
  })();

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

  if (storageArea.tipBlock) {
    for (const blockIdentifier of pathBetween(
      storageArea.tipBlock,
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
        indexKey: makeIndexKey(indexDefinition, entity),
      }));

      for (const { indexKey, id, value } of entitiesWithIndexValue) {
        if (indexKey < startingKey) {
          continue;
        }

        visitedValues.add(id);

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

  const generator = makeGenerator(indexPrefix, startingKey, visitedValues);

  const nextValue = await generator.next();
  if (!nextValue.done) {
    heap.push({
      type: "GENERATOR",
      value: nextValue.value,
      generator: generator,
    });
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

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
      startingIndexKey?: string;
    };

export interface Reader<EntityDefinitionsType extends EntityDefinitions> {
  readonly entityDefinitions: EntityDefinitionsType;

  getEntity<Entity extends keyof EntityDefinitionsType & string>(
    entity: Entity,
    id: string
  ): Promise<RuntimeType<EntityDefinitionsType[Entity]["serde"]> | null>;

  getEntitiesByIndex<
    Entity extends keyof EntityDefinitionsType & string,
    IndexName extends EntityDefinitionsType[Entity]["indexes"][0]["indexName"]
  >(
    entity: Entity,
    indexName: IndexName,
    args: IndexQueryArgs
  ): AsyncGenerator<RuntimeType<EntityDefinitionsType[Entity]["serde"]>>;
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
        value: serde.cloneSerdeValue(entityDefinition.serde, fromStorage),
      };
    }
  }

  return null;
}

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
  ) => AsyncGenerator<{ indexKey: string; value: any }>
): AsyncGenerator<RuntimeType<EntityDefinitionsType[Entity]["serde"]>> {
  if (!storageArea.tipBlock) {
    return null;
  }

  if (!storageArea.latestBlockNumber) {
    return null;
  }

  const indexDefinition = entityDefinition.indexes.find(
    (indexDefinition) => indexDefinition.indexName === indexName
  )!;

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

        if (args.startingIndexKey) {
          return {
            indexPrefix,
            startingKey: makeIndexKeyRaw(
              entity,
              indexName,
              args.startingIndexKey,
              ""
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
        indexKey: string;
        value: any;
      }
    | {
        type: "GENERATOR";
        indexKey: string;
        value: any;
        generator: AsyncGenerator<{ indexKey: string; value: any }>;
      };

  const heap = new Heap<HeapValue>(compareBy((it) => it.indexKey));

  const visitedValues = new Set<string>();

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
        indexKey,
        value,
      });
    }

    const generator = makeGenerator(indexPrefix, startingKey, visitedValues);

    const nextValue = await generator.next();
    if (nextValue.done) {
      break;
    }

    heap.push({
      type: "GENERATOR",
      indexKey: nextValue.value.indexKey,
      value: nextValue.value.value,
      generator: generator,
    });
  }

  while (true) {
    const item = heap.pop();
    if (!item) {
      break;
    }

    switch (item.type) {
      case "VALUE": {
        if (!item.indexKey.startsWith(indexPrefix)) {
          break;
        }

        yield item.value;
        break;
      }

      case "GENERATOR": {
        yield item.value;

        const nextValue = await item.generator.next();
        if (!nextValue.done) {
          heap.push({
            type: "GENERATOR",
            generator: item.generator,

            value: nextValue.value.value,
            indexKey: nextValue.value.indexKey,
          });
        }
      }
    }
  }
}

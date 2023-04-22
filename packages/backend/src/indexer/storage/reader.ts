import Heap from "heap";

import { makeEntityKey } from "../entityKey";
import { StorageArea } from "../followChain";
import {
  IndexKeyType,
  makeIndexKey,
  makeIndexPrefix,
  serializeIndexKey,
} from "../indexKey";
import { EntityDefinition } from "../process";
import * as serde from "../serde";
import { RuntimeType } from "../serde";
import { BlockIdentifier, pathBetween } from "../storageHandle";
import { compareBy } from "../utils/sortUtils";

export type EntityDefinitions = {
  [key: string]: EntityDefinition;
};

export type IndexQueryArgs = {
  prefix?: IndexKeyType;
  starting?: IndexKeyType;
};

export function exactIndexValue(indexKey: string): IndexQueryArgs {
  return {
    prefix: {
      indexKey,
    },
    starting: {
      indexKey,
    },
  };
}

export interface Reader<EntityDefinitionsType extends EntityDefinitions> {
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

  getLatestBlock(): BlockIdentifier;
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
  makeGenerator?: (
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
    const indexKeyPrefix = makeIndexPrefix(entity, indexName);

    return {
      startingKey:
        indexKeyPrefix +
        (!!args.starting ? serializeIndexKey(args.starting) : ""),
      indexPrefix:
        indexKeyPrefix + (!!args.prefix ? serializeIndexKey(args.prefix) : ""),
    };
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

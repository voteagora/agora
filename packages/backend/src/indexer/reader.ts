import { EntityDefinition } from "./process";
import { RuntimeType } from "./serde";
import { makeEntityKey } from "./entityKey";
import { Level } from "level";
import { makeIndexKey, makeIndexPrefix } from "./indexKey";
import { StorageArea } from "./followChain";
import { generateLineagePath } from "./storageHandle";
import Heap from "heap";
import { compareBy } from "./utils/sortUtils";

type EntityDefinitions = {
  [key: string]: EntityDefinition;
};

interface Reader<EntityDefinitionsType extends EntityDefinitions> {
  getEntity<Entity extends keyof EntityDefinitionsType & string>(
    entity: Entity,
    id: string
  ): Promise<RuntimeType<EntityDefinitionsType[Entity]["serde"]> | null>;

  getEntitiesByIndex<
    Entity extends keyof EntityDefinitionsType & string,
    IndexName extends EntityDefinitionsType[Entity]["indexes"][number]["indexName"]
  >(
    entity: Entity,
    indexName: IndexName,
    startingIndexKey: string
  ): AsyncGenerator<RuntimeType<EntityDefinitionsType[Entity]["serde"]>>;
}

export class LevelReader<EntityDefinitionsType extends EntityDefinitions>
  implements Reader<EntityDefinitionsType>
{
  private readonly entityDefinitions: EntityDefinitionsType;

  private readonly level: Level;

  private readonly storageArea: StorageArea;

  constructor(
    entityDefinitions: EntityDefinitionsType,
    level: Level,
    storageArea: StorageArea
  ) {
    this.entityDefinitions = entityDefinitions;
    this.level = level;
    this.storageArea = storageArea;
  }

  async *getEntitiesByIndex<
    Entity extends keyof EntityDefinitionsType & string,
    IndexName extends EntityDefinitionsType[Entity]["indexes"][number]["indexName"]
  >(
    entity: Entity,
    indexName: IndexName
  ): AsyncGenerator<RuntimeType<EntityDefinitionsType[Entity]["serde"]>> {
    if (!this.storageArea.tipBlock) {
      return null;
    }

    if (!this.storageArea.latestBlockNumber) {
      return null;
    }

    const entityDefinition = this.entityDefinitions[entity];
    const indexDefinition = entityDefinition.indexes.find(
      (indexDefinition) => indexDefinition.indexName === indexName
    )!;
    const indexPrefix = makeIndexPrefix(entity, indexName);

    const lineagePath = generateLineagePath(
      this.storageArea.tipBlock,
      this.storageArea.parents,
      this.storageArea.latestBlockNumber
    );

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

    for (const node of lineagePath) {
      switch (node.type) {
        case "BLOCK": {
          const blockStorageArea = this.storageArea.blockStorageAreas.get(
            node.blockIdentifier.hash
          );
          if (!blockStorageArea) {
            continue;
          }

          const entities = Array.from(
            blockStorageArea.entities.values()
          ).filter((it) => it.entity === entity);

          const entitiesWithIndexValue = entities.map((entity) => ({
            value: entity.value,
            indexKey: makeIndexKey(indexDefinition, entity),
          }));

          for (const { indexKey, value } of entitiesWithIndexValue) {
            heap.push({
              type: "VALUE",
              indexKey,
              value,
            });
          }

          break;
        }

        case "FINALIZED": {
          const level = this.level;
          const generator = (async function* () {
            for await (const [key, entityId] of level.iterator({
              gte: indexPrefix,
            })) {
              if (!key.startsWith(indexPrefix)) {
                break;
              }

              // todo: there is a consistency bug here which can't be fixed because
              //  this leveldb wrapper does not expose snapshots
              const rawValue = await level.get(makeEntityKey(entity, entityId));
              if (!rawValue) {
                throw new Error("index value not found");
              }

              const value = entityDefinition.serde.deserialize(rawValue);
              yield {
                indexKey: key,
                value,
              };
            }
          })();

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

          break;
        }
      }
    }

    while (true) {
      const item = heap.pop();
      if (!item) {
        break;
      }

      switch (item.type) {
        case "VALUE": {
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

  async getEntity<Entity extends keyof EntityDefinitionsType & string>(
    entity: Entity,
    id: string
  ): Promise<RuntimeType<EntityDefinitionsType[Entity]["serde"]> | null> {
    if (!this.storageArea.tipBlock) {
      return null;
    }

    if (!this.storageArea.latestBlockNumber) {
      return null;
    }

    // todo: this is quite similar to the storage handle implementation
    const lineagePath = generateLineagePath(
      this.storageArea.tipBlock,
      this.storageArea.parents,
      this.storageArea.latestBlockNumber
    );
    for (const node of lineagePath) {
      switch (node.type) {
        case "BLOCK": {
          const key = makeEntityKey(entity, id);
          const blockStorageArea = this.storageArea.blockStorageAreas.get(
            node.blockIdentifier.hash
          );
          if (!blockStorageArea) {
            continue;
          }

          if (blockStorageArea.entities.has(key)) {
            const fromStorage = blockStorageArea.entities.get(key)!;
            return fromStorage.value;
          }

          break;
        }

        case "FINALIZED": {
          const key = makeEntityKey(entity, id);
          const fromLevel = this.level.get(key);
          if (!fromLevel) {
            return null;
          }

          const entityDefinition = this.entityDefinitions[entity];

          return entityDefinition.serde.deserialize(fromLevel);
        }
      }
    }

    return null;
  }
}

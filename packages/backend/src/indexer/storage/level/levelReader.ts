import { StorageArea } from "../../followChain";
import { RuntimeType } from "../../serde";
import { makeEntityKey } from "../../entityKey";
import {
  EntityDefinitions,
  getEntitiesByIndexFromStorageArea,
  getEntityFromStorageArea,
  IndexQueryArgs,
  Reader,
} from "../reader";
import { Level } from "level";
import { coerceLevelDbNotfoundError } from "./utils";

export class LevelReader<EntityDefinitionsType extends EntityDefinitions>
  implements Reader<EntityDefinitionsType>
{
  readonly entityDefinitions: EntityDefinitionsType;

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
    indexName: IndexName,
    args: IndexQueryArgs
  ): AsyncGenerator<RuntimeType<EntityDefinitionsType[Entity]["serde"]>> {
    const level = this.level;
    const entityDefinition = this.entityDefinitions[entity];

    return getEntitiesByIndexFromStorageArea(
      entity,
      entityDefinition,
      indexName,
      args,
      this.storageArea,
      async function* (indexPrefix, startingKey, visitedValues) {
        for await (const [indexKey, entityId] of level.iterator({
          gte: startingKey,
        })) {
          if (!indexKey.startsWith(indexPrefix)) {
            break;
          }

          if (visitedValues.has(entityId)) {
            continue;
          }

          // todo: there is a consistency bug here which can't be fixed because
          //  this leveldb wrapper does not expose snapshots
          const rawValue = await level.get(makeEntityKey(entity, entityId));
          if (!rawValue) {
            throw new Error("index value not found");
          }

          const value = entityDefinition.serde.deserialize(rawValue);
          yield {
            indexKey: indexKey,
            value,
          };
        }
      }
    );
  }

  async getEntity<Entity extends keyof EntityDefinitionsType & string>(
    entity: Entity,
    id: string
  ): Promise<RuntimeType<EntityDefinitionsType[Entity]["serde"]> | null> {
    const entityDefinition = this.entityDefinitions[entity];
    const fromStorage = getEntityFromStorageArea(
      this.storageArea,
      entity,
      entityDefinition,
      id
    );
    if (fromStorage) {
      return fromStorage.value;
    }

    const key = makeEntityKey(entity, id);
    const fromLevel = await coerceLevelDbNotfoundError(this.level.get(key));
    if (!fromLevel) {
      return null;
    }

    return entityDefinition.serde.deserialize(fromLevel);
  }
}
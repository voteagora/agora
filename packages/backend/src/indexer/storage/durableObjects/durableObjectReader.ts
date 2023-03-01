import {
  EntityDefinitions,
  getEntitiesByIndexFromStorageArea,
  getEntityFromStorageArea,
  IndexedValue,
  IndexQueryArgs,
  Reader,
} from "../reader";
import { StorageArea } from "../../followChain";
import { RuntimeType } from "../../serde";
import { makeEntityKey } from "../../entityKey";
import { listEntries, StorageInterface } from "./storageInterface";
import { BlockIdentifier } from "../../storageHandle";

export class DurableObjectReader<
  EntityDefinitionsType extends EntityDefinitions
> implements Reader<EntityDefinitionsType>
{
  private readonly entityDefinitions: EntityDefinitionsType;

  private readonly storage: StorageInterface;

  private readonly storageArea: StorageArea;

  constructor(
    entityDefinitions: EntityDefinitionsType,
    storage: StorageInterface,
    storageArea: StorageArea
  ) {
    this.entityDefinitions = entityDefinitions;
    this.storage = storage;
    this.storageArea = storageArea;
  }

  getEntitiesByIndex<
    Entity extends keyof EntityDefinitionsType & string,
    IndexName extends EntityDefinitionsType[Entity]["indexes"][0]["indexName"]
  >(
    entity: Entity,
    indexName: IndexName,
    args: IndexQueryArgs
  ): AsyncGenerator<
    IndexedValue<Readonly<RuntimeType<EntityDefinitionsType[Entity]["serde"]>>>
  > {
    const entityDefinition = this.entityDefinitions[entity];
    const storage = this.storage;
    return getEntitiesByIndexFromStorageArea(
      entity,
      entityDefinition,
      indexName,
      args,
      this.storageArea,
      async function* (indexPrefix, startingKey, visitedValues) {
        for await (const [indexKey, rawEntityId] of listEntries(storage, {
          start: startingKey,
          prefix: indexPrefix,
        })) {
          const entityId = rawEntityId as string;

          if (visitedValues.has(entityId)) {
            continue;
          }

          // todo: there is a consistency bug here. it might not be very important though
          const rawValue = await storage.get(makeEntityKey(entity, entityId), {
            allowConcurrency: true,
          });
          if (!rawValue) {
            throw new Error("index value not found");
          }

          const value = entityDefinition.serde.deserialize(rawValue);
          yield {
            entityId,
            indexKey,
            value,
          };
        }
      }
    );
  }

  async getEntity<Entity extends keyof EntityDefinitionsType & string>(
    entity: Entity,
    id: string
  ): Promise<Readonly<
    RuntimeType<EntityDefinitionsType[Entity]["serde"]>
  > | null> {
    const entityDefinition = this.entityDefinitions[entity];

    const fromStorageArea = getEntityFromStorageArea(
      this.storageArea,
      entity,
      entityDefinition,
      id
    );

    if (fromStorageArea) {
      return fromStorageArea.value;
    }

    const key = makeEntityKey(entity, id);
    const fromLevel = await this.storage.get(key, {
      allowConcurrency: true,
    });
    if (!fromLevel) {
      return null;
    }

    return entityDefinition.serde.deserialize(fromLevel);
  }

  getLatestBlock(): BlockIdentifier {
    return this.storageArea.tipBlock ?? this.storageArea.finalizedBlock;
  }
}

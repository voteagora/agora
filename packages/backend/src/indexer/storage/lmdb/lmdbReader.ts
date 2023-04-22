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
import { BlockIdentifier } from "../../storageHandle";

import { LmdbEntityStore } from "./lmdbEntityStore";

export class LmdbReader<EntityDefinitionsType extends EntityDefinitions>
  implements Reader<EntityDefinitionsType>
{
  private readonly entityDefinitions: EntityDefinitionsType;

  private readonly storageArea: StorageArea;

  private readonly entityStore: LmdbEntityStore;

  constructor(
    entityDefinitions: EntityDefinitionsType,
    entityStore: LmdbEntityStore,
    storageArea: StorageArea
  ) {
    this.entityDefinitions = entityDefinitions;
    this.entityStore = entityStore;
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
    const lmdb = this.entityStore.lmdb;

    return getEntitiesByIndexFromStorageArea(
      entity,
      entityDefinition,
      indexName,
      args,
      this.storageArea,
      async function* (indexPrefix, startingKey, visitedValues) {
        for (const { key, value: entityId } of lmdb.getRange({
          start: startingKey,
        })) {
          const indexKey = key as string;
          if (!indexKey.startsWith(indexPrefix)) {
            break;
          }

          if (visitedValues.has(indexKey)) {
            continue;
          }

          const rawValue = lmdb.get(makeEntityKey(entity, entityId));
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
    const fromStorage = getEntityFromStorageArea(
      this.storageArea,
      entity,
      entityDefinition,
      id
    );
    if (fromStorage) {
      return fromStorage.value;
    }

    const fromStore = await this.entityStore.getEntity(entity, id);
    if (!fromStore) {
      return null;
    }

    return entityDefinition.serde.deserialize(fromStore);
  }

  getLatestBlock(): BlockIdentifier {
    return this.storageArea.tipBlock ?? this.storageArea.finalizedBlock;
  }
}

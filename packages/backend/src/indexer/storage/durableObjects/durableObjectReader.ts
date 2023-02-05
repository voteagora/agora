import {
  EntityDefinitions,
  getEntitiesByIndexFromStorageArea,
  getEntityFromStorageArea,
  IndexQueryArgs,
  Reader,
} from "../reader";
import { StorageArea } from "../../followChain";
import { RuntimeType } from "../../serde";
import { makeEntityKey } from "../../entityKey";

export class DurableObjectReader<
  EntityDefinitionsType extends EntityDefinitions
> implements Reader<EntityDefinitionsType>
{
  readonly entityDefinitions: EntityDefinitionsType;

  private readonly storage: DurableObjectStorage;

  private readonly storageArea: StorageArea;

  constructor(
    entityDefinitions: EntityDefinitionsType,
    storage: DurableObjectStorage,
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
    Readonly<RuntimeType<EntityDefinitionsType[Entity]["serde"]>>
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
          if (!indexKey.startsWith(indexPrefix)) {
            break;
          }

          const entityId = rawEntityId as string;

          if (visitedValues.has(entityId)) {
            continue;
          }

          // todo: there is a consistency bug here. it might not be very important though
          const rawValue = await storage.get(makeEntityKey(entity, entityId));
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
}

export type ListEntriesArgs = {
  start?: string;
  prefix?: string;
};

export async function* listEntries<T>(
  storage: DurableObjectStorage,
  args?: ListEntriesArgs
): AsyncGenerator<[string, T]> {
  const limit = 1000;

  let start = args?.start;

  while (true) {
    const values = await storage.list({
      start,
      prefix: args?.prefix,
      limit,
      allowConcurrency: true,
    });

    const entries = Array.from(values.entries());
    if (!entries.length) {
      return;
    }

    // @ts-ignore
    yield* entries;

    const [lastEntryKey] = entries[entries.length - 1];
    start = lastEntryKey;
  }
}

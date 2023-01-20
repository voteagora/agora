import { IndexerDefinition } from "./process";
import { RuntimeType } from "./serde";
import { makeEntityKey } from "./entityKey";
import { Level } from "level";
import { combineEntities, EntityDefinitions } from "./entityStore";
import { makeIndexPrefix } from "./indexKey";

interface Reader<Indexers extends IndexerDefinition[]> {
  getEntity<Entity extends keyof EntityDefinitions<Indexers> & string>(
    entity: Entity,
    id: string
  ): Promise<RuntimeType<EntityDefinitions<Indexers>[Entity]["serde"]> | null>;

  getEntitiesByIndex<
    Entity extends keyof EntityDefinitions<Indexers> & string,
    IndexName extends EntityDefinitions<Indexers>[Entity]["indexes"][number]["indexName"]
  >(
    entity: Entity,
    indexName: IndexName,
    startingIndexKey: string
  ): AsyncGenerator<RuntimeType<EntityDefinitions<Indexers>[Entity]["serde"]>>;
}

// todo: intermediate reads

class LevelReader<Indexers extends IndexerDefinition[]>
  implements Reader<Indexers>
{
  private readonly indexers: IndexerDefinition[];

  private readonly level: Level;

  constructor(indexers: IndexerDefinition[], level: Level) {
    this.indexers = indexers;
    this.level = level;
  }

  async *getEntitiesByIndex<
    Entity extends keyof EntityDefinitions<Indexers> & string,
    IndexName extends EntityDefinitions<Indexers>[Entity]["indexes"][number]["indexName"]
  >(
    entity: Entity,
    indexName: IndexName
  ): AsyncGenerator<RuntimeType<EntityDefinitions<Indexers>[Entity]["serde"]>> {
    const entityDefinitions = combineEntities(this.indexers);
    const entityDefinition = entityDefinitions[entity];

    const indexPrefix = makeIndexPrefix(entity, indexName);

    for await (const [key, entityId] of this.level.iterator({
      gte: indexPrefix,
    })) {
      if (!key.startsWith(indexPrefix)) {
        break;
      }

      const rawValue = await this.level.get(makeEntityKey(entity, entityId));
      if (!rawValue) {
        throw new Error("index value not found");
      }

      const value = entityDefinition.serde.deserialize(rawValue);

      yield value;
    }
  }

  async getEntity<Entity extends keyof EntityDefinitions<Indexers> & string>(
    entity: Entity,
    id: string
  ): Promise<RuntimeType<EntityDefinitions<Indexers>[Entity]["serde"]> | null> {
    const key = makeEntityKey(entity, id);
    const fromLevel = this.level.get(key);
    if (!fromLevel) {
      return null;
    }

    const combinedEntities = combineEntities(this.indexers);
    const entityDefinition = combinedEntities[entity];

    return entityDefinition.serde.deserialize(fromLevel);
  }
}

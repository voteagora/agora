import { BatchOperation, Level } from "level";
import { BlockIdentifier, coerceLevelDbNotfoundError } from "./storageHandle";
import { entityKeyPrefix, makeEntityKey, parseEntityKey } from "./keys";
import { EntityDefinition, IndexerDefinition } from "./process";
import { makeIndexKey } from "./fieldIndex";

export interface EntityStore extends ReadOnlyEntityStore {
  flushUpdates(
    blockIdentifier: BlockIdentifier,
    indexers: IndexerDefinition[],
    entities: Map<string, EntityWithMetadata>
  ): Promise<void>;
}

export function combineEntities(indexers: IndexerDefinition[]) {
  return indexers.reduce(
    (acc, indexer) => ({ ...acc, ...indexer.entities }),
    {}
  );
}

export function serializeEntities<StorageType>(
  entityDefinitions: ReturnType<typeof combineEntities>,
  entities: Map<string, any>
): Map<string, StorageType> {
  return new Map([
    ...Array.from(entities.entries()).map(
      ([key, value]): [string, StorageType] => {
        const parsedKey = parseEntityKey(key);
        if (!parsedKey) {
          return [key, value];
        }

        const serde = (entityDefinitions as any)[parsedKey.entity]!.serde;
        return [key, serde.serialize(value)];
      }
    ),
  ]);
}

export type EntityWithMetadata<T = any> = {
  entity: string;
  id: string;
  value: T;
};

export interface ReadOnlyEntityStore {
  getFinalizedBlock(): Promise<BlockIdentifier | null>;
  getEntity(entity: string, id: string): Promise<any>;
  getEntities(): AsyncGenerator<EntityWithMetadata>;
}

type LevelKeyType<LevelType extends Level> = LevelType extends Level<
  infer KeyType
>
  ? KeyType
  : never;

type LevelValueType<LevelType extends Level> = LevelType extends Level<
  any,
  infer ValueType
>
  ? ValueType
  : never;

type LevelBatchOperation<LevelType extends Level> = BatchOperation<
  LevelType,
  LevelKeyType<LevelType>,
  LevelValueType<LevelType>
>;

export class LevelEntityStore implements EntityStore {
  private readonly level: Level<string, any>;

  static async open() {
    const level = new Level<string, any>("./data/state", {
      valueEncoding: "json",
    });
    await level.open();

    return new LevelEntityStore(level);
  }

  constructor(level: Level<string, any>) {
    this.level = level;
  }
  async getFinalizedBlock(): Promise<BlockIdentifier | null> {
    return await coerceLevelDbNotfoundError(this.level.get("latest"));
  }

  getEntities(): AsyncGenerator<EntityWithMetadata> {
    const level = this.level;

    return (async function* levelEntityStoreGetEntities() {
      for await (const [key, value] of level.iterator({
        gte: entityKeyPrefix,
      })) {
        const entityKey = parseEntityKey(key);
        if (!entityKey) {
          break;
        }

        yield { ...entityKey, value };
      }
    })();
  }

  /**
   * Writes entities, updating indexes and latest entity tracking.
   */
  async flushUpdates(
    block: BlockIdentifier,
    indexers: IndexerDefinition[],
    entities: Map<string, EntityWithMetadata>
  ): Promise<void> {
    const values = Array.from(entities.values());
    const entityDefinitions = combineEntities(indexers);

    // todo: only fetch for ones with indexes
    const oldValues = await this.level.getMany(
      values.map((it) => makeEntityKey(it.entity, it.id))
    );

    const entries = oldValues.map((oldValue, idx) => {
      return {
        entity: values[idx].entity,
        id: values[idx].id,
        newValue: values[idx].value,
        oldValue,
      };
    });

    type BatchOperation = LevelBatchOperation<typeof this.level>;

    const operations: BatchOperation[] = entries.flatMap<BatchOperation>(
      (entry) => {
        const entityDefinition: EntityDefinition = (entityDefinitions as any)[
          entry.entity
        ]!;

        return [
          {
            type: "put",
            key: makeEntityKey(entry.entity, entry.id),
            value: entityDefinition.serde.serialize(entry.newValue),
          },
          ...(entityDefinition.indexes ?? []).flatMap<BatchOperation>(
            (indexDefinition): BatchOperation[] => {
              return [
                {
                  type: "del",
                  key: makeIndexKey(indexDefinition, {
                    entity: entry.entity,
                    id: entry.id,
                    value: entry.oldValue,
                  }),
                },
                {
                  type: "put",
                  key: makeIndexKey(indexDefinition, {
                    entity: entry.entity,
                    id: entry.id,
                    value: entry.newValue,
                  }),
                  value: entry.id,
                },
              ];
            }
          ),
        ];
      }
    );

    await this.level.batch([
      ...operations,
      {
        type: "put",
        key: "latest",
        value: block,
      },
    ]);
  }

  async getEntity(entity: string, id: string): Promise<any | null> {
    return await coerceLevelDbNotfoundError(
      this.level.get(makeEntityKey(entity, id))
    );
  }
}

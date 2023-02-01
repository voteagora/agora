import { BlockIdentifier } from "../../storageHandle";
import { makeEntityKey } from "../../entityKey";
import { EntityDefinition, IndexerDefinition } from "../../process";
import { makeIndexKey } from "../../indexKey";
import {
  blockIdentifierKey,
  combineEntities,
  EntityStore,
  EntityWithMetadata,
} from "../entityStore";
import { BatchOperation, Level } from "level";
import { coerceLevelDbNotfoundError } from "./utils";
import { StoredEntry } from "../dump";

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
  readonly level: Level<string, any>;

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
    return await coerceLevelDbNotfoundError(this.level.get(blockIdentifierKey));
  }

  getEntities(): AsyncGenerator<StoredEntry> {
    const level = this.level;

    return (async function* levelEntityStoreGetEntities() {
      for await (const [key, value] of level.iterator()) {
        yield { key, value };
      }
    })();
  }

  /**
   * Writes entities, updating indexes and latest entity tracking.
   */
  async flushUpdates(
    block: BlockIdentifier,
    indexers: IndexerDefinition[],
    updatedEntities: EntityWithMetadata[]
  ): Promise<void> {
    const entityDefinitions = combineEntities(indexers);

    const oldValues = await this.level.getMany(
      updatedEntities.map((it) => makeEntityKey(it.entity, it.id))
    );

    const entries = oldValues.map((oldValue, idx) => {
      return {
        entity: updatedEntities[idx].entity,
        id: updatedEntities[idx].id,
        newValue: updatedEntities[idx].value,
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
                ...(() => {
                  if (!entry.oldValue) {
                    return [];
                  }

                  return [
                    {
                      type: "del" as const,
                      key: makeIndexKey(indexDefinition, {
                        entity: entry.entity,
                        id: entry.id,
                        value: entityDefinition.serde.deserialize(
                          entry.oldValue
                        ),
                      }),
                    },
                  ];
                })(),
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
        key: blockIdentifierKey,
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

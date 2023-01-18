import { Level } from "level";
import { BlockIdentifier, coerceLevelDbNotfoundError } from "./storageHandle";
import { entityKeyPrefix, makeEntityKey, parseEntityKey } from "./keys";
import { IndexerDefinition } from "./process";

export interface EntityStore extends ReadOnlyEntityStore {
  // todo: the strings in entities are a bit leaky
  updateFinalizedBlock(
    block: BlockIdentifier,
    entities: Map<string, any>
  ): Promise<void>;
}

export function serializeEntities<StorageType>(
  indexer: IndexerDefinition,
  entities: Map<string, any>
): Map<string, StorageType> {
  return new Map([
    ...Array.from(entities.entries()).map(
      ([key, value]): [string, StorageType] => {
        const parsedKey = parseEntityKey(key);
        if (!parsedKey) {
          return [key, value];
        }

        return [key, indexer.entities[parsedKey.entity].serde.serialize(value)];
      }
    ),
  ]);
}

export type EntityWithMetadata = {
  entity: string;
  id: string;
  value: any;
};

export interface ReadOnlyEntityStore {
  getFinalizedBlock(): Promise<BlockIdentifier | null>;
  getEntity(entity: string, id: string): Promise<any>;
  getEntities(): AsyncGenerator<EntityWithMetadata>;
}

export class MemoryEntityStore implements EntityStore {
  private values: Map<string, any> = new Map();

  async getEntity(entity: string, id: string): Promise<any> {
    return this.values.get(makeEntityKey(entity, id));
  }

  private finalizedBlock: BlockIdentifier | null;
  async getFinalizedBlock(): Promise<BlockIdentifier | null> {
    return this.finalizedBlock;
  }

  async updateFinalizedBlock(
    block: BlockIdentifier,
    entities: Map<string, any>
  ): Promise<void> {
    this.finalizedBlock = block;

    for (const [key, value] of entities.entries()) {
      entities.set(key, value);
    }
  }

  getEntities(): AsyncGenerator<EntityWithMetadata> {
    const values = this.values;
    return (async function* () {
      for (const [key, value] of values) {
        const entityKey = parseEntityKey(key);
        if (!entityKey) {
          continue;
        }

        yield {
          ...entityKey,
          value,
        };
      }
    })();
  }
}

export class LevelEntityStore implements EntityStore {
  private readonly level: Level<string, any>;

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

  async updateFinalizedBlock(
    block: BlockIdentifier,
    entities: Map<string, any>
  ): Promise<void> {
    const batch = this.level.batch();

    batch.put("latest", block);

    for (const [key, value] of entities.entries()) {
      batch.put(key, value);
    }

    await batch.write();
  }

  async getEntity(entity: string, id: string): Promise<any | null> {
    return await coerceLevelDbNotfoundError(
      this.level.get(makeEntityKey(entity, id))
    );
  }
}

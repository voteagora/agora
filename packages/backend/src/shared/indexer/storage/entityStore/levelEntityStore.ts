import path from "path";

import { Level } from "level";

import { BlockIdentifier } from "../../process/storageHandle";
import { makeEntityKey } from "../keys/entityKey";
import { StoredEntry } from "../dump";
import { blockIdentifierKey } from "../keys/keys";
import { IndexQueryArgs, resolveIndexQueryArgs } from "../indexQueryArgs";
import { EntityDefinitions, IndexedValue } from "../reader/type";

import { updatesForEntities } from "./updates";
import {
  EntityStore,
  EntityWithMetadata,
  ExportableEntityStore,
  ImportableEntityStore,
} from "./entityStore";

const env = process.env.ENVIRONMENT || "dev";
export class LevelEntityStore
  implements EntityStore, ImportableEntityStore, ExportableEntityStore
{
  constructor(private readonly level: Level<string, any>) {}

  static async open(basePath: string) {
    const level = new Level<string, any>(path.join(basePath, "state-" + env), {
      valueEncoding: "json",
    });
    await level.open();

    return new LevelEntityStore(level);
  }

  async getEntity(entity: string, id: string): Promise<unknown | null> {
    return await coerceLevelDbNotfoundError(
      this.level.get(makeEntityKey(entity, id))
    );
  }

  async *getEntities(
    entityName: string,
    indexName: string,
    indexQueryArgs: IndexQueryArgs,
    visitedEntityIds: ReadonlySet<string>
  ): AsyncGenerator<IndexedValue<Readonly<unknown>>> {
    const { startingKey, indexPrefix } = resolveIndexQueryArgs(
      entityName,
      indexName,
      indexQueryArgs
    );

    for await (const [indexKey, entityId] of this.level.iterator({
      gte: startingKey,
    })) {
      if (!indexKey.startsWith(indexPrefix)) {
        break;
      }

      if (visitedEntityIds.has(entityId)) {
        continue;
      }

      const rawValue = await this.getEntity(entityName, entityId);
      if (!rawValue) {
        throw new Error("index value not found");
      }

      yield {
        entityId,
        indexKey: indexKey,
        value: rawValue,
      };
    }
  }

  async getFinalizedBlock(): Promise<BlockIdentifier | null> {
    return await coerceLevelDbNotfoundError(this.level.get(blockIdentifierKey));
  }

  /**
   * Writes entities, updating indexes and latest entity tracking.
   */
  async flushUpdates(
    block: BlockIdentifier,
    entityDefinitions: EntityDefinitions,
    updatedEntities: EntityWithMetadata[]
  ): Promise<void> {
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

    await this.level.batch(
      updatesForEntities(
        block,
        await this.getFinalizedBlock(),
        entries,
        entityDefinitions
      ).map(({ operation: it }) => {
        switch (it.type) {
          case "PUT": {
            return {
              type: "put",
              key: it.key,
              value: it.value,
            };
          }

          case "DELETE": {
            return {
              type: "del",
              key: it.key,
            };
          }
        }
      })
    );
  }

  async *getStoredEntities(): AsyncGenerator<StoredEntry> {
    for await (const [key, value] of this.level.iterator()) {
      yield { key, value };
    }
  }

  async loadStoredEntities(
    storedEntities: AsyncGenerator<StoredEntry>
  ): Promise<void> {
    await this.level.clear();

    for await (const item of storedEntities) {
      await this.level.put(item.key, item.value);
    }
  }
}

export function coerceLevelDbNotfoundError<T>(
  promise: Promise<T>
): Promise<T | null> {
  return promise.catch((err) => {
    if (err.code === "LEVEL_NOT_FOUND") {
      return null;
    } else {
      throw err;
    }
  });
}

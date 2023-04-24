import lmdb from "lmdb";

import { BlockIdentifier } from "../../process/storageHandle";
import { makeEntityKey } from "../keys/entityKey";
import { blockIdentifierKey } from "../keys/keys";
import { IndexQueryArgs, resolveIndexQueryArgs } from "../indexQueryArgs";
import { EntityDefinitions, IndexedValue } from "../reader/type";

import { updatesForEntities } from "./updates";
import { EntityWithMetadata, EntityStore } from "./entityStore";

export class LmdbEntityStore implements EntityStore {
  constructor(private readonly lmdb: lmdb.RootDatabase) {}

  static async open() {
    const db = await lmdb.open("./data/lmdbstate", {});
    return new LmdbEntityStore(db);
  }

  async getEntity(entity: string, id: string): Promise<unknown> {
    return (await this.lmdb.get(makeEntityKey(entity, id))) ?? null;
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

    for (const { key, value: entityId } of this.lmdb.getRange({
      start: startingKey,
    })) {
      const indexKey = key as string;
      if (!indexKey.startsWith(indexPrefix)) {
        break;
      }

      if (visitedEntityIds.has(indexKey)) {
        continue;
      }

      const rawValue = await this.getEntity(entityName, entityId);
      if (!rawValue) {
        throw new Error("index value not found");
      }

      yield {
        entityId,
        indexKey,
        value: rawValue,
      };
    }
  }

  async getFinalizedBlock(): Promise<BlockIdentifier | null> {
    return (await this.lmdb.get(blockIdentifierKey)) ?? null;
  }

  async flushUpdates(
    blockIdentifier: BlockIdentifier,
    entityDefinitions: EntityDefinitions,
    updatedEntities: EntityWithMetadata[]
  ): Promise<void> {
    const oldValues = await this.lmdb.getMany(
      updatedEntities.map((it) => makeEntityKey(it.entity, it.id))
    );

    const updates = updatesForEntities(
      blockIdentifier,
      await this.getFinalizedBlock(),
      updatedEntities.map((it, idx) => ({
        id: it.id,
        entity: it.entity,
        newValue: it.value,
        oldValue: oldValues[idx],
      })),
      entityDefinitions
    );

    await this.lmdb.transaction(() => {
      for (const { operation: update } of updates) {
        switch (update.type) {
          case "PUT": {
            this.lmdb.put(update.key, update.value);
            break;
          }

          case "DELETE": {
            this.lmdb.remove(update.key);
            break;
          }
        }
      }
    });
  }
}

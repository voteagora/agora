import lmdb from "lmdb";

import {
  blockIdentifierKey,
  EntityStore,
  EntityWithMetadata,
} from "../entityStore";
import { BlockIdentifier } from "../../storageHandle";
import { makeEntityKey } from "../../entityKey";
import { updatesForEntities } from "../updates";
import { EntityDefinitions } from "../reader";

export class LmdbEntityStore implements EntityStore {
  readonly lmdb: lmdb.RootDatabase;

  constructor(lmdb: lmdb.RootDatabase) {
    this.lmdb = lmdb;
  }

  static async open() {
    const db = await lmdb.open("./data/lmdbstate", {});
    return new LmdbEntityStore(db);
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

  async getEntity(entity: string, id: string): Promise<any> {
    return (await this.lmdb.get(makeEntityKey(entity, id))) ?? null;
  }

  async getFinalizedBlock(): Promise<BlockIdentifier | null> {
    return (await this.lmdb.get(blockIdentifierKey)) ?? null;
  }
}

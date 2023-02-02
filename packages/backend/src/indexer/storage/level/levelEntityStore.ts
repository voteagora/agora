import { BlockIdentifier } from "../../storageHandle";
import { makeEntityKey } from "../../entityKey";
import { IndexerDefinition } from "../../process";
import {
  blockIdentifierKey,
  combineEntities,
  EntityStore,
  EntityWithMetadata,
} from "../entityStore";
import { Level } from "level";
import { coerceLevelDbNotfoundError } from "./utils";
import { StoredEntry } from "../dump";
import { updatesForEntities } from "../updates";

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

    await this.level.batch(
      updatesForEntities(block, entries, entityDefinitions).map((it) => {
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

  async getEntity(entity: string, id: string): Promise<any | null> {
    return await coerceLevelDbNotfoundError(
      this.level.get(makeEntityKey(entity, id))
    );
  }
}

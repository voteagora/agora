import {
  blockIdentifierKey,
  combineEntities,
  EntityStore,
  EntityWithMetadata,
} from "../entityStore";
import { BlockIdentifier } from "../../storageHandle";
import { IndexerDefinition } from "../../process";
import { makeEntityKey } from "../../entityKey";
import { updatesForEntities } from "../updates";

export class DurableObjectEntityStore implements EntityStore {
  private readonly storage: DurableObjectStorage;

  constructor(storage: DurableObjectStorage) {
    this.storage = storage;
  }

  async flushUpdates(
    blockIdentifier: BlockIdentifier,
    indexers: IndexerDefinition[],
    updatedEntities: EntityWithMetadata[]
  ): Promise<void> {
    const entityDefinitions = combineEntities(indexers);

    const oldValues = await this.storage.get(
      updatedEntities.map((it) => makeEntityKey(it.entity, it.id))
    );

    const updates = updatesForEntities(
      blockIdentifier,
      updatedEntities.map((it) => {
        return {
          entity: it.entity,
          id: it.id,
          newValue: it.value,
          oldValue: oldValues.get(makeEntityKey(it.entity, it.id)),
        };
      }),
      entityDefinitions
    );

    // All operations here should be:
    // * allowConcurrency: true because we are fine with other reads and
    //   writes happening after all reads.
    //
    // * allowUnconfirmed: true because we do not care about write durability
    //   with updates. If they're dropped, we can recreate them from the
    //   chain.
    await this.storage.transaction(async (txn) => {
      for (const update of updates) {
        switch (update.type) {
          case "PUT": {
            txn.put(update.key, update.value, {
              allowConcurrency: true,
              allowUnconfirmed: true,
            });
            break;
          }

          case "DELETE": {
            txn.delete(update.key, {
              allowConcurrency: true,
              allowUnconfirmed: true,
            });
            break;
          }
        }
      }
    });
  }

  async getEntity(entity: string, id: string): Promise<any> {
    return (await this.storage.get(makeEntityKey(entity, id))) ?? null;
  }

  async getFinalizedBlock(): Promise<BlockIdentifier | null> {
    return (await this.storage.get(blockIdentifierKey)) ?? null;
  }
}

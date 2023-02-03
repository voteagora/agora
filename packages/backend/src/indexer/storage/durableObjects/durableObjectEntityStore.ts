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

    const oldValues = await Promise.all(
      updatedEntities.map(async (it) =>
        this.storage.get(makeEntityKey(it.entity, it.id))
      )
    );

    const updates = updatesForEntities(
      blockIdentifier,
      updatedEntities.map((it, idx) => {
        return {
          entity: it.entity,
          id: it.id,
          newValue: it.value,
          oldValue: oldValues[idx],
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
    await exclusiveRegion(this.storage, async () => {
      for (const update of updates) {
        switch (update.type) {
          case "PUT": {
            await this.storage.put(update.key, update.value, {
              allowConcurrency: true,
            });
            break;
          }

          case "DELETE": {
            await this.storage.delete(update.key, {
              allowConcurrency: true,
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

export async function exclusiveRegion<T>(
  storage: DurableObjectStorage,
  fn: () => Promise<T>
): Promise<T> {
  const withinRegion = await storage.get(exclusiveRegionKey);
  if (withinRegion) {
    throw new Error("already locked");
  }

  await storage.put(exclusiveRegionKey, "locked");

  const result = await fn();

  await storage.delete(exclusiveRegionKey);

  return result;
}

const exclusiveRegionKey = "isInExclusiveRegion";

import {
  combineEntities,
  EntityStore,
  EntityWithMetadata,
} from "../entityStore";
import { BlockIdentifier } from "../../storageHandle";
import { IndexerDefinition } from "../../process";
import { makeEntityKey } from "../../entityKey";
import { makeIndexKey } from "../../indexKey";
import { blockIdentifierKey } from "../level/levelEntityStore";

export class DurableObjectEntityStore implements EntityStore {
  private readonly storage: DurableObjectStorage;

  constructor(storage: DurableObjectStorage) {
    this.storage = storage;
  }

  async flushUpdates(
    blockIdentifier: BlockIdentifier,
    indexers: IndexerDefinition[],
    entities: Map<string, EntityWithMetadata>
  ): Promise<void> {
    const entityDefinitions = combineEntities(indexers);
    const values = Array.from(entities.values());

    await this.storage.transaction(async (txn) => {
      // All operations here should be:
      // * allowConcurrency: true because we are fine with other reads and
      //   writes happening after all reads.
      //
      // * allowUnconfirmed: true because we do not care about write durability
      //   with updates. If they're dropped, we can recreate them from the
      //   chain.

      for (const { entity, id, value } of values) {
        const entityDefinition = entityDefinitions[entity];

        txn.put(
          makeEntityKey(entity, id),
          entityDefinition.serde.serialize(value),
          {
            allowConcurrency: true,
            allowUnconfirmed: true,
          }
        );

        for (const indexDefinition of entityDefinition.indexes) {
          const oldValueRaw =
            (await txn.get(makeEntityKey(entity, id), {
              allowConcurrency: true,
            })) ?? null;

          if (oldValueRaw) {
            const oldValue = entityDefinition.serde.deserialize(oldValueRaw);
            txn.delete(
              makeIndexKey(indexDefinition, {
                entity,
                id,
                value: oldValue,
              }),
              {
                allowConcurrency: true,
                allowUnconfirmed: true,
              }
            );
          }

          txn.put(makeIndexKey(indexDefinition, { entity, id, value }), id, {
            allowConcurrency: true,
            allowUnconfirmed: true,
          });
        }
      }

      txn.put(blockIdentifierKey, blockIdentifier);
    });
  }

  async getEntity(entity: string, id: string): Promise<any> {
    return (await this.storage.get(makeEntityKey(entity, id))) ?? null;
  }

  async getFinalizedBlock(): Promise<BlockIdentifier | null> {
    return (await this.storage.get(blockIdentifierKey)) ?? null;
  }
}

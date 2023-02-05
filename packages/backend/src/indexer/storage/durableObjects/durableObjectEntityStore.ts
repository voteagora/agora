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
import { listEntries } from "./durableObjectReader";
import {
  asyncIterableFromIterable,
  batch,
  collectGenerator,
} from "../../utils/generatorUtils";
import { efficientLengthEncodingNaturalNumbers } from "../../utils/efficientLengthEncoding";
import { BigNumber } from "ethers";

type UndoLogEntry = {
  key: string;
  previousValue: unknown | null;
};

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

    // All operations here should be:
    // * allowConcurrency: true because we are fine with other reads and
    //   writes happening after all reads.
    //
    // * allowUnconfirmed: true because we do not care about write durability
    //   with updates. If they're dropped, we can recreate them from the
    //   chain.
    const updates = updatesForEntities(
      blockIdentifier,
      await this.getFinalizedBlock(),
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

    for (const [idx, operation] of updates.entries()) {
      await this.storage.transaction(async (txn) => {
        const update = operation.operation;

        switch (update.type) {
          case "PUT": {
            await txn.put(update.key, update.value, {
              allowConcurrency: true,
            });
            break;
          }

          case "DELETE": {
            await txn.delete(update.key, {
              allowConcurrency: true,
            });
            break;
          }
        }

        const undoLogEntry: UndoLogEntry = {
          key: update.key,
          previousValue: operation.previousValue,
        };

        await txn.put(
          `${undoLogPrefix}${efficientLengthEncodingNaturalNumbers(
            BigNumber.from(idx)
          )}`,
          undoLogEntry
        );
      });
    }

    const batches = await collectGenerator(
      batch(asyncIterableFromIterable(updates.entries()), 128)
    );

    for (const batch of batches) {
      await this.storage.delete(
        batch.map(
          ([idx]) =>
            `${undoLogPrefix}${efficientLengthEncodingNaturalNumbers(
              BigNumber.from(idx)
            )}`
        )
      );
    }
  }

  async ensureConsistentState(): Promise<void> {
    const undoLogFirstEntry = await this.storage.get(
      `${undoLogPrefix}${efficientLengthEncodingNaturalNumbers(
        BigNumber.from(0)
      )}`
    );

    if (undoLogFirstEntry || (await this.storage.get(rollingBackStartedKey))) {
      await this.storage.put(rollingBackStartedKey, true);
      // rollback the undo log
      for await (const [key, value] of listEntries<UndoLogEntry>(this.storage, {
        prefix: undoLogPrefix,
      })) {
        await this.storage.transaction(async (txn) => {
          await txn.delete(key);

          if (value.previousValue === null) {
            await txn.delete(value.key);
          } else {
            await txn.put(value.key, value.previousValue);
          }
        });
      }
      await this.storage.delete(rollingBackStartedKey);
    } else {
      for await (const [key] of listEntries<UndoLogEntry>(this.storage, {
        prefix: undoLogPrefix,
      })) {
        await this.storage.delete(key);
      }
    }
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

const undoLogPrefix = "undoLog|";

const rollingBackStartedKey = "rollingBackStartedKey";

import {
  blockIdentifierKey,
  EntityStore,
  EntityWithMetadata,
} from "../entityStore";
import { BlockIdentifier } from "../../storageHandle";
import { makeEntityKey } from "../../entityKey";
import { updatesForEntities } from "../updates";
import {
  asyncIterableFromIterable,
  batch,
  collectGenerator,
} from "../../utils/generatorUtils";
import { efficientLengthEncodingNaturalNumbers } from "../../utils/efficientLengthEncoding";
import { BigNumber } from "ethers";
import { listEntries, StorageInterface } from "./storageInterface";
import { EntityDefinitions } from "../reader";

type UndoLogEntry = {
  key: string;
  previousValue: unknown | null;
};

// All operations here should be:
// * allowConcurrency: true because we are fine with other reads and writes
//   happening after all reads.
//
// * allowUnconfirmed: true because we do not care about write durability with
//   updates. If they're dropped, we can recreate them from the chain as long
//   as updates are chopped off the tail and not missing from in-between.

export class DurableObjectEntityStore implements EntityStore {
  private readonly storage: StorageInterface;

  constructor(storage: StorageInterface) {
    this.storage = storage;
  }

  async flushUpdates(
    blockIdentifier: BlockIdentifier,
    entityDefinitions: EntityDefinitions,
    updatedEntities: EntityWithMetadata[]
  ): Promise<void> {
    const oldValues = await Promise.all(
      updatedEntities.map(async (it) =>
        this.storage.get(makeEntityKey(it.entity, it.id), {
          allowConcurrency: true,
        })
      )
    );

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
              allowUnconfirmed: true,
            });
            break;
          }

          case "DELETE": {
            await txn.delete(update.key, {
              allowConcurrency: true,
              allowUnconfirmed: true,
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
          undoLogEntry,
          {
            allowConcurrency: true,
            allowUnconfirmed: true,
          }
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
        ),
        {
          allowConcurrency: true,
          allowUnconfirmed: true,
        }
      );
    }
  }

  async ensureConsistentState(): Promise<void> {
    const undoLogFirstEntry = await this.storage.get(
      `${undoLogPrefix}${efficientLengthEncodingNaturalNumbers(
        BigNumber.from(0)
      )}`,
      {
        allowConcurrency: true,
      }
    );

    if (undoLogFirstEntry || (await this.storage.get(rollingBackStartedKey))) {
      await this.storage.put(rollingBackStartedKey, true, {
        allowConcurrency: true,
        allowUnconfirmed: true,
      });
      // rollback the undo log
      for await (const [key, value] of listEntries<UndoLogEntry>(this.storage, {
        prefix: undoLogPrefix,
      })) {
        await this.storage.transaction(async (txn) => {
          await txn.delete(key, {
            allowConcurrency: true,
            allowUnconfirmed: true,
          });

          if (value.previousValue === null) {
            await txn.delete(value.key, {
              allowConcurrency: true,
              allowUnconfirmed: true,
            });
          } else {
            await txn.put(value.key, value.previousValue, {
              allowConcurrency: true,
              allowUnconfirmed: true,
            });
          }
        });
      }
      await this.storage.delete(rollingBackStartedKey, {
        allowConcurrency: true,
        allowUnconfirmed: true,
      });
    } else {
      for await (const [key] of listEntries<UndoLogEntry>(this.storage, {
        prefix: undoLogPrefix,
      })) {
        await this.storage.delete(key, {
          allowConcurrency: true,
        });
      }
    }
  }

  async getEntity(entity: string, id: string): Promise<any> {
    return (
      (await this.storage.get(makeEntityKey(entity, id), {
        allowConcurrency: true,
      })) ?? null
    );
  }

  async getFinalizedBlock(): Promise<BlockIdentifier | null> {
    return (
      (await this.storage.get(blockIdentifierKey, {
        allowConcurrency: true,
      })) ?? null
    );
  }
}

const undoLogPrefix = "undoLog|";

const rollingBackStartedKey = "rollingBackStartedKey";

import { DurableObjectEntityStore } from "./durableObjectEntityStore";
import { MemoryStorage } from "./memoryStorage";
import { FailableStorage } from "./failableStorage";
import fc from "fast-check";
import * as serde from "../../serde";
import { infiniteStream } from "../../utils/generatorUtils";
import { EntityDefinitions } from "../reader";

describe("durableObjectEntityStore", () => {
  it("works in the face of arbitrary failures", async () => {
    const entityDefinitions: EntityDefinitions = {
      Entity: {
        serde: serde.object({
          field: serde.string,
        }),
        indexes: [
          {
            indexName: "field",
            indexKey(entity) {
              return entity.field;
            },
          },
        ],
      },
    };

    await fc.assert(
      fc.asyncProperty(fc.infiniteStream(fc.boolean()), async (stream) => {
        let lastValues = new Map<string, unknown>();

        for (let attemptNumber = 0; true; attemptNumber++) {
          const memoryStorage = new MemoryStorage(lastValues);
          const failableStorage = new FailableStorage(
            memoryStorage,
            attemptNumber < 2 ? stream : infiniteStream(false)
          );
          const entityStore = new DurableObjectEntityStore(failableStorage);

          try {
            await entityStore.flushUpdates(
              {
                hash: "0x462cee4b869131e08b03caea27901e16af214c6930f427c650e475c4bbaa3302",
                blockNumber: 72486800,
              },
              entityDefinitions,
              [
                {
                  entity: "Entity",
                  id: "1",
                  value: {
                    field: "firstValue",
                  },
                },
                {
                  entity: "Entity",
                  id: "2",
                  value: {
                    field: "secondValue",
                  },
                },
              ]
            );

            break;
          } catch (e) {
            continue;
          } finally {
            lastValues = memoryStorage.getValues();
          }
        }

        expect(lastValues).toMatchInlineSnapshot(`
          Map {
            "entity|Entity|1" => {
              "field": "firstValue",
            },
            "entity|Entity|2" => {
              "field": "secondValue",
            },
            "indexes|Entity|field|firstValue|1" => "1",
            "indexes|Entity|field|secondValue|2" => "2",
            "latest" => {
              "blockNumber": 72486800,
              "hash": "0x462cee4b869131e08b03caea27901e16af214c6930f427c650e475c4bbaa3302",
            },
          }
        `);
      }),
      {
        // need a large amount of runs to generate sufficient cases, might be
        // simpler to just write these explicitly
        numRuns: 100000,
      }
    );

    // todo: maybe write these cases explicitly
    // if flushUpdates fails without completing the initial write ensure the rollback log is correct
    // ensure that after ensureConsistentState is called, the undo log is cleared and undos are applied
    // if flushUpdates fails after completing the initial write but before clearing the rollback log
    // ensure that after ensureConsistentState is called, the undo log is cleared and undos are applied
    // if flushUpdates fails after completing the initial write but midway through clearing the rollback log
    // ensure that after ensureConsistentState is called, the remaining undo log is cleared
    // if ensureConsistentState fails midway through a rollback,
    // calling ensureConsistentStateAgain should lead to a rollback being completed
    // if ensureConsistentStateFails midway through an undo log clear,
    // calling ensureConsistentState again should lead to the undo log clearing
    // we need some way to make the underlying abstraction fail after a certain point
  });
});

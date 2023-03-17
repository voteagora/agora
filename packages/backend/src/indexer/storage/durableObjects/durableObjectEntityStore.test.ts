import { fc, it } from "@fast-check/jest";

import * as serde from "../../serde";

import { EntityDefinitions } from "../reader";

import { DurableObjectEntityStore } from "./durableObjectEntityStore";
import { MemoryStorage } from "./memoryStorage";
import { FailableStorage } from "./failableStorage";


describe("durableObjectEntityStore", () => {
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

  it.prop([fc.infiniteStream(fc.boolean())], {
    numRuns: 10000,
  })("works in the face of arbitrary failures", async (stream) => {
    const memoryStorage = new MemoryStorage();

    // initialize
    {
      const entityStore = new DurableObjectEntityStore(memoryStorage);

      await entityStore.flushUpdates(
        {
          hash: "0x462cee4b869131e08b03caea27901e16af214c6930f427c650e475c4bbaa3301",
          blockNumber: 72486799,
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
    }

    // test
    {
      const failableStorage = new FailableStorage(memoryStorage, stream);
      const entityStore = new DurableObjectEntityStore(failableStorage);

      await entityStore
        .flushUpdates(
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
                field: "firstValueUpdated",
              },
            },
            {
              entity: "Entity",
              id: "2",
              value: {
                field: "secondValueUpdated",
              },
            },
            {
              entity: "Entity",
              id: "3",
              value: {
                field: "newValue",
              },
            },
          ]
        )
        .catch((e) => e);

      const ensureConsistentStateError = await entityStore
        .ensureConsistentState()
        .catch((e) => e);

      if (ensureConsistentStateError) {
        const entityStore = new DurableObjectEntityStore(memoryStorage);
        await entityStore.ensureConsistentState();
      }
    }

    // assert
    {
      const entityStore = new DurableObjectEntityStore(memoryStorage);
      const latestBlock = (await entityStore.getFinalizedBlock())!;
      const lastValues = memoryStorage.getValues();
      if (latestBlock.blockNumber === 72486799) {
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
              "blockNumber": 72486799,
              "hash": "0x462cee4b869131e08b03caea27901e16af214c6930f427c650e475c4bbaa3301",
            },
          }
        `);
      }
    }

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

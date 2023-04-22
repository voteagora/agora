import { makeIndexKey } from "../indexKey";
import { makeEntityDefinition } from "../process";
import * as serde from "../serde";
import { RuntimeType } from "../serde";
import { makeStorageAreaFromBlockSequence } from "../testUtils";
import { collectGenerator } from "../utils/generatorUtils";

import { mapEntriesForEntity } from "./entityStore";
import { getEntitiesByIndexFromStorageArea, IndexedValue } from "./reader";

describe("getEntitiesByIndexFromStorageArea", () => {
  const TestEntity = makeEntityDefinition({
    serde: serde.object({
      item: serde.string,
    }),
    indexes: [
      {
        indexName: "byItem",
        indexKey(entity) {
          return entity.item;
        },
      },
    ],
  });

  function transformValue(
    entityId: string,
    value: RuntimeType<typeof TestEntity["serde"]>
  ): IndexedValue<Readonly<RuntimeType<typeof TestEntity["serde"]>>> {
    return {
      entityId,
      value,
      indexKey: makeIndexKey(indexDefinition, {
        id: entityId,
        entity: "TestEntity",
        value: value,
      }),
    };
  }

  const indexDefinition = TestEntity.indexes[0];

  it("merges duplicate values from different storage areas correctly", async () => {
    const storageArea = makeStorageAreaFromBlockSequence([
      {
        entities: new Map([
          mapEntriesForEntity({
            id: "1",
            entity: "TestEntity",
            value: {
              item: "f",
            },
          }),
        ]),
      },

      {
        entities: new Map([
          mapEntriesForEntity({
            id: "2",
            entity: "TestEntity",
            value: {
              item: "g",
            },
          }),
        ]),
      },

      {
        entities: new Map([
          mapEntriesForEntity({
            id: "3",
            entity: "TestEntity",
            value: {
              item: "h",
            },
          }),
        ]),
      },
    ]);

    const entities = await collectGenerator(
      getEntitiesByIndexFromStorageArea(
        "TestEntity",
        TestEntity,
        indexDefinition.indexName,
        {},
        storageArea,
        async function* () {
          yield transformValue("1", {
            item: "a",
          });
          yield transformValue("2", {
            item: "b",
          });
          yield transformValue("3", {
            item: "c",
          });
        }
      )
    );

    expect(entities).toMatchInlineSnapshot(`
      [
        {
          "entityId": "1",
          "indexKey": "f",
          "value": {
            "item": "f",
          },
        },
        {
          "entityId": "2",
          "indexKey": "g",
          "value": {
            "item": "g",
          },
        },
        {
          "entityId": "3",
          "indexKey": "h",
          "value": {
            "item": "h",
          },
        },
      ]
    `);
  });

  it("works with prefix", async () => {
    const storageArea = makeStorageAreaFromBlockSequence([
      {
        entities: new Map([
          mapEntriesForEntity({
            id: "1",
            entity: "TestEntity",
            value: {
              item: "f",
            },
          }),
        ]),
      },

      {
        entities: new Map([
          mapEntriesForEntity({
            id: "2",
            entity: "TestEntity",
            value: {
              item: "g",
            },
          }),
        ]),
      },

      {
        entities: new Map([
          mapEntriesForEntity({
            id: "3",
            entity: "TestEntity",
            value: {
              item: "h",
            },
          }),
        ]),
      },
    ]);

    const entities = await collectGenerator(
      getEntitiesByIndexFromStorageArea(
        "TestEntity",
        TestEntity,
        indexDefinition.indexName,
        {
          starting: {
            indexKey: "g",
          },
        },
        storageArea,
        async function* () {
          yield transformValue("1", {
            item: "a",
          });
          yield transformValue("2", {
            item: "b",
          });
          yield transformValue("3", {
            item: "c",
          });
        }
      )
    );

    expect(entities).toMatchInlineSnapshot(`
      [
        {
          "entityId": "2",
          "indexKey": "g",
          "value": {
            "item": "g",
          },
        },
        {
          "entityId": "3",
          "indexKey": "h",
          "value": {
            "item": "h",
          },
        },
      ]
    `);
  });
});

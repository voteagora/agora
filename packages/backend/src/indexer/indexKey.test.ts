import { makeIndexPrefix, serializeIndexKey } from "./indexKey";

describe("serializeIndexKey", () => {
  it("doesn't terminate index key with suffix", () => {
    expect(
      serializeIndexKey({
        indexKey: "indexKey",
      })
    ).toEqual("indexKey");
  });

  it("inserts separator between index key and entityId", () => {
    expect(
      serializeIndexKey({
        indexKey: "indexKey",
        entityId: "entityId",
      })
    ).toEqual("indexKey|entityId");
  });
});

describe("makeIndexPrefix", () => {
  it("serializes", () => {
    expect(makeIndexPrefix("Entity", "indexName")).toMatchInlineSnapshot(
      `"indexes|Entity|indexName|"`
    );
  });
});

import { MemoryStorage } from "./memoryStorage";

describe("memoryStorage", () => {
  it("commits transactions", async () => {
    const memoryStore = new MemoryStorage(
      new Map<string, unknown>([
        ["a", 1],
        ["b", 2],
        ["c", 3],
      ])
    );

    await memoryStore.transaction(async (txn) => {
      await txn.put("d", 1);
    });

    expect(memoryStore.values).toMatchInlineSnapshot(`
      Map {
        "a" => 1,
        "b" => 2,
        "c" => 3,
        "d" => 1,
      }
    `);
  });

  it("rolls back transactions correctly", async () => {
    const memoryStore = new MemoryStorage(
      new Map<string, unknown>([
        ["a", 1],
        ["b", 2],
        ["c", 3],
      ])
    );

    const error = new Error("something failed");

    await expect(() =>
      memoryStore.transaction(async (txn) => {
        await txn.put("d", 1);
        throw error;
      })
    ).rejects.toThrowError(error);

    expect(memoryStore.values).toMatchInlineSnapshot(`
      Map {
        "a" => 1,
        "b" => 2,
        "c" => 3,
      }
    `);
  });
});

import { FailableStorage } from "./failableStorage";
import { MemoryStorage } from "./memoryStorage";
import { DurableObjectEntityStore } from "./durableObjectEntityStore";

describe("failableStorage", () => {
  it("fails after markFailing", async () => {
    const storage = new FailableStorage(new MemoryStorage());
    const entityStore = new DurableObjectEntityStore(storage);

    storage.markFailing();

    const finalizedBlockPromise = entityStore.getFinalizedBlock();

    await expect(finalizedBlockPromise).rejects.toMatchInlineSnapshot(
      `[Error: failing]`
    );
  });

  it("succeeds without markFailing", async () => {
    const storage = new FailableStorage(new MemoryStorage());
    const entityStore = new DurableObjectEntityStore(storage);

    const finalizedBlockPromise = entityStore.getFinalizedBlock();

    await expect(finalizedBlockPromise).resolves.toMatchInlineSnapshot(`null`);
  });
});

import { infiniteStream } from "../../utils/generatorUtils";

import { DurableObjectEntityStore } from "./durableObjectEntityStore";
import { FailableStorage } from "./failableStorage";
import { MemoryStorage } from "./memoryStorage";

describe("failableStorage", () => {
  it("fails when failure stream provided", async () => {
    const storage = new FailableStorage(
      new MemoryStorage(),
      infiniteStream(true)
    );
    const entityStore = new DurableObjectEntityStore(storage);

    const finalizedBlockPromise = entityStore.getFinalizedBlock();

    await expect(finalizedBlockPromise).rejects.toMatchInlineSnapshot(
      `[Error: failing]`
    );
  });

  it("succeeds when success stream provided", async () => {
    const storage = new FailableStorage(
      new MemoryStorage(),
      infiniteStream(false)
    );
    const entityStore = new DurableObjectEntityStore(storage);

    const finalizedBlockPromise = entityStore.getFinalizedBlock();

    await expect(finalizedBlockPromise).resolves.toMatchInlineSnapshot(`null`);
  });
});

import { promises as fs } from "fs";
import { LevelEntityStore } from "../storage/level/levelEntityStore";
import { createParentDirectory } from "../utils/pathUtils";

async function main() {
  const entityStore = await LevelEntityStore.open();
  const path = "data/dump/Optimism.jsonl";
  await createParentDirectory(path);
  const logFile = await fs.open(path, "w");

  for await (const entity of entityStore.getEntities()) {
    await logFile.write(JSON.stringify(entity) + "\n");
  }

  await logFile.close();
}

main();

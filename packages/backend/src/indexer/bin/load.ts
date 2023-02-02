import { LevelEntityStore } from "../storage/level/levelEntityStore";
import { loadExportFile } from "../export/fs";

async function main() {
  const entityStore = await LevelEntityStore.open();
  const level = entityStore.level;

  await level.clear();

  for await (const item of loadExportFile()) {
    await level.put(item.key, item.value);
  }
}

main();

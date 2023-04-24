import { promises as fs } from "fs";

import { ExportableEntityStore } from "../storage/entityStore/entityStore";
import { dumpFilePath } from "../export/fs";

export async function dump(
  entityStore: ExportableEntityStore,
  dataDirectory: string
) {
  const logFile = await fs.open(dumpFilePath(dataDirectory), "w");

  for await (const entity of entityStore.getStoredEntities()) {
    await logFile.write(JSON.stringify(entity) + "\n");
  }

  await logFile.close();
}

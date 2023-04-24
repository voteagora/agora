import { loadExportFile } from "../export/fs";
import { ImportableEntityStore } from "../storage/entityStore/entityStore";

export async function load(entityStore: ImportableEntityStore, name: string) {
  await entityStore.loadStoredEntities(loadExportFile(name));
}

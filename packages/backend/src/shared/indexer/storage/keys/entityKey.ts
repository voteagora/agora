export const entityKeyPrefix = "entity";

export function makeEntityKey(entity: string, id: string) {
  return [entityKeyPrefix, entity, id].join("|");
}

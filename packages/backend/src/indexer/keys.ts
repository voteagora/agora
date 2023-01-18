export const entityKeyPrefix = "entity";

export function makeEntityKey(entity: string, id: string) {
  return [entityKeyPrefix, entity, id].join("|");
}

export function parseEntityKey(raw: string) {
  const parts = raw.split("|");
  if (parts.length != 3) {
    return null;
  }

  const [prefix, entity, id] = parts;
  if (prefix !== entityKeyPrefix) {
    return null;
  }

  return { entity, id };
}

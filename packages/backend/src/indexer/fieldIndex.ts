import { EntityDefinition, IndexerDefinition } from "./process";
import { combineEntities, EntityWithMetadata } from "./entityStore";
import { parseEntityKey } from "./keys";

// todo: indexes on mutable fields are not implemented correctly when fields mutate

export function withIndexFields(
  values: Map<string, any>,
  indexer: IndexerDefinition[]
): Map<string, any> {
  const combinedEntities = combineEntities(indexer);
  return new Map([
    ...values.entries(),
    ...Array.from(values.entries()).flatMap(([key, value]) => {
      const entity = parseEntityKey(key);
      if (!entity) {
        throw new Error(`failed to parse entity key ${key}`);
      }

      return makeIndexEntries(
        { id: entity.id, entity: entity.entity, value: value },
        (combinedEntities as any)[entity.entity]
      );
    }),
  ]);
}

export function makeIndexEntries(
  { id, value, entity }: EntityWithMetadata,
  entityDefinition: EntityDefinition
): [string, string][] {
  return (entityDefinition.indexes ?? []).map((indexDefinition) => {
    const indexKey = indexDefinition.indexKey(value);

    return [makeIndexKey(indexDefinition.indexName, entity, indexKey), id];
  });
}

export function makeIndexKey(
  indexName: string,
  entity: string,
  indexKey: string
) {
  return ["indexes", entity, indexName, indexKey].join("|");
}

import { IndexerDefinition } from "./process";
import { EntityWithMetadata } from "./entityStore";
import { parseEntityKey } from "./keys";

export function withIndexFields(
  values: Map<string, any>,
  indexer: IndexerDefinition<any, any>
): Map<string, any> {
  return new Map(
    ...values,
    Array.from(values.entries()).flatMap(([key, value]) => {
      const entity = parseEntityKey(key);
      if (!entity) {
        throw new Error(`failed to parse entity key ${key}`);
      }

      return makeIndexEntries(
        { id: entity.id, entity: entity.entity, value: value },
        indexer
      );
    })
  );
}

export function makeIndexEntries(
  { id, value, entity }: EntityWithMetadata,
  indexer: IndexerDefinition<any, any>
): [string, string][] {
  const entityIndexes = indexer.indexes[entity] ?? [];
  return entityIndexes.map((indexDefinition) => {
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

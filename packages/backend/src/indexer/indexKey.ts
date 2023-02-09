import { IndexDefinition } from "./process";
import { EntityWithMetadata } from "./storage/entityStore";
import { RuntimeType, SerDe } from "./serde";

export function makeIndexKey<Type extends SerDe<any, any>>(
  indexDefinition: IndexDefinition<Type, string>,
  { id: entityId, entity, value }: EntityWithMetadata<RuntimeType<Type>>
) {
  return [
    "indexes",
    entity,
    indexDefinition.indexName,
    indexDefinition.indexKey(value),
    entityId,
  ].join("|");
}

export type IndexKeyType = {
  indexKey: string;
  entityId?: string;
};

export function serializeIndexKey(indexKeyType: IndexKeyType) {
  return [
    indexKeyType.indexKey,
    ...(() => {
      if (!indexKeyType.entityId) {
        return [];
      }

      return [indexKeyType.entityId];
    })(),
  ].join("|");
}

export const indexSeparator = "|";

export function makeIndexPrefix(entity: string, indexName: string) {
  return ["indexes", entity, indexName, ""].join(indexSeparator);
}

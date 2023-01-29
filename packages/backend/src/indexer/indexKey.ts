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

export function makeIndexKeyRaw(
  entity: string,
  indexName: string,
  indexKey: string,
  entityId: string
) {
  return ["indexes", entity, indexName, indexKey, entityId].join("|");
}

export function makeIndexPrefix(entity: string, indexName: string) {
  return ["indexes", entity, indexName].join("|");
}

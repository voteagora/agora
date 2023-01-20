import { IndexDefinition } from "./process";
import { EntityWithMetadata } from "./entityStore";
import { RuntimeType, SerDe } from "./serde";

export function makeIndexKey<Type extends SerDe<any, any>>(
  indexDefinition: IndexDefinition<Type>,
  { id, entity, value }: EntityWithMetadata<RuntimeType<Type>>
) {
  return [
    "indexes",
    entity,
    indexDefinition.indexName,
    indexDefinition.indexKey(value),
    id,
  ].join("|");
}

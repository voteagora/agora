import { IndexDefinition } from "../../process/process";
import { RuntimeType, SerDe } from "../../serde";
import { EntityWithMetadata } from "../entityStore/entityStore";

export function makeIndexKey<Type extends SerDe<any, any>>(
  indexDefinition: IndexDefinition<Type>,
  indexName: string,
  { id: entityId, entity, value }: EntityWithMetadata<RuntimeType<Type>>
) {
  return [
    "indexes",
    entity,
    indexName,
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

export function makeCompoundKey(...args: string[]) {
  return args.join("#");
}

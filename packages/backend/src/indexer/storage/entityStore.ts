import { BlockIdentifier } from "../storageHandle";
import { EntityDefinitions } from "./reader";
import { makeEntityKey } from "../entityKey";
import { RuntimeType } from "../serde";

export interface EntityStore extends ReadOnlyEntityStore {
  flushUpdates(
    blockIdentifier: BlockIdentifier,
    entityDefinitions: EntityDefinitions,
    updatedEntities: EntityWithMetadata[]
  ): Promise<void>;
}

export type EntityWithMetadata<T = unknown> = {
  entity: string;
  id: string;
  value: T;
};

export type EntitiesWithMetadata<
  EntityDefinitionsType extends EntityDefinitions
> = {
  [Entity in keyof EntityDefinitionsType & string]: {
    entity: Entity;
    id: string;
    value: RuntimeType<EntityDefinitionsType[Entity]["serde"]>;
  };
}[keyof EntityDefinitionsType & string];

export function mapEntriesForEntity<T = unknown>(
  entityWithMetadata: EntityWithMetadata<T>
): [string, EntityWithMetadata<T>] {
  const { entity, id } = entityWithMetadata;

  return [makeEntityKey(entity, id), entityWithMetadata];
}

export function setMapEntries<K, V>(map: Map<K, V>, [key, value]: [K, V]) {
  map.set(key, value);
}

export interface ReadOnlyEntityStore {
  getFinalizedBlock(): Promise<BlockIdentifier | null>;
  getEntity(entity: string, id: string): Promise<any>;
}

export const blockIdentifierKey = "latest";

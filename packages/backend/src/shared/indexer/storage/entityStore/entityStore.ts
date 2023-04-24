import { BlockIdentifier } from "../../process/storageHandle";
import { RuntimeType } from "../../serde";
import { IndexQueryArgs } from "../indexQueryArgs";
import { StoredEntry } from "../dump";
import { EntityDefinitions, IndexedValue } from "../reader/type";

export interface EntityStore
  extends ReadOnlyEntityStore,
    WriteOnlyEntityStore {}

export interface WriteOnlyEntityStore {
  /**
   * Flushes updates to the underlying storage. This operation should be
   * atomic. Either all updates inside the implementation of this method
   * should be applied or none of them.
   *
   * See {@link updatesForEntities} for a helper function to generate
   * storage updates for entities and indexes from entity changes.
   */
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

export interface ReadOnlyEntityStore {
  getFinalizedBlock(): Promise<BlockIdentifier | null>;

  getEntity(entity: string, id: string): Promise<unknown>;

  getEntities(
    entityName: string,
    indexName: string,
    indexQueryArgs: IndexQueryArgs,
    visitedEntityIds: ReadonlySet<string>
  ): AsyncGenerator<IndexedValue<Readonly<unknown>>>;
}

export interface ExportableEntityStore {
  getStoredEntities(): AsyncGenerator<StoredEntry>;
}

export interface ImportableEntityStore {
  loadStoredEntities(
    storedEntities: AsyncGenerator<StoredEntry>
  ): Promise<void>;
}

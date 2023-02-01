import { BlockIdentifier } from "../storageHandle";
import { IndexerDefinition } from "../process";

export interface EntityStore extends ReadOnlyEntityStore {
  flushUpdates(
    blockIdentifier: BlockIdentifier,
    indexers: IndexerDefinition[],
    updatedEntities: EntityWithMetadata[]
  ): Promise<void>;
}

export type EntityDefinitions<Indexers extends IndexerDefinition[]> =
  Indexers[number]["entities"];

export function combineEntities<Indexers extends IndexerDefinition[]>(
  indexers: IndexerDefinition[]
): EntityDefinitions<Indexers> {
  return indexers.reduce(
    (acc, indexer) => ({ ...acc, ...indexer.entities }),
    {}
  );
}

export type EntityWithMetadata<T = unknown> = {
  entity: string;
  id: string;
  value: T;
};

export interface ReadOnlyEntityStore {
  getFinalizedBlock(): Promise<BlockIdentifier | null>;
  getEntity(entity: string, id: string): Promise<any>;
}

export const blockIdentifierKey = "latest";

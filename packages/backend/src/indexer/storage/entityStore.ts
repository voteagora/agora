import { BlockIdentifier } from "../storageHandle";
import { IndexerDefinition } from "../process";
import { EntityDefinitions } from "./reader";

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

export interface ReadOnlyEntityStore {
  getFinalizedBlock(): Promise<BlockIdentifier | null>;
  getEntity(entity: string, id: string): Promise<any>;
}

export const blockIdentifierKey = "latest";

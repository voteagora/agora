import { RuntimeType } from "../../serde";
import { BlockIdentifier } from "../../process/storageHandle";
import { IndexQueryArgs } from "../indexQueryArgs";
import { EntityDefinition } from "../../process/process";

export type EntityDefinitions = {
  [key: string]: EntityDefinition;
};

export interface Reader<EntityDefinitionsType extends EntityDefinitions>
  extends ReaderEntities<EntityDefinitionsType> {
  getLatestBlock(): BlockIdentifier;

  getEntitiesByIndex<
    Entity extends keyof EntityDefinitionsType & string,
    IndexName extends keyof EntityDefinitionsType[Entity]["indexes"] & string
  >(
    entity: Entity,
    indexName: IndexName,
    args: IndexQueryArgs
  ): AsyncGenerator<
    IndexedValue<RuntimeType<EntityDefinitionsType[Entity]["serde"]>>
  >;
}

export interface ReaderEntities<
  EntityDefinitionsType extends EntityDefinitions
> {
  entityDefinitions: EntityDefinitionsType;

  getEntity<Entity extends keyof EntityDefinitionsType & string>(
    entity: Entity,
    id: string
  ): Promise<RuntimeType<EntityDefinitionsType[Entity]["serde"]> | null>;
}

export type IndexedValue<T> = {
  entityId: string;
  indexKey: string;
  value: T;
};

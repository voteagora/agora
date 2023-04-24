import { mapEntriesForEntity } from "../../process/storageHandle";
import { StorageArea } from "../../process/followChain";
import { makeStorageAreaFromBlockSequence } from "../../testUtils";
import {
  EntitiesWithMetadata,
  EntityWithMetadata,
} from "../entityStore/entityStore";
import { DurableObjectEntityStore } from "../entityStore/durableObjects/durableObjectEntityStore";
import { MemoryStorage } from "../entityStore/durableObjects/storageInterface/memory/memoryStorage";

import { makeReader } from "./reader";
import { EntityDefinitions } from "./type";

export function makeTestReader<EntityDefinitionsType extends EntityDefinitions>(
  entityDefinitions: EntityDefinitionsType,
  entities: EntitiesWithMetadata<EntityDefinitionsType>[]
) {
  return makeReader(
    new DurableObjectEntityStore(new MemoryStorage()),
    makeTestStorageArea(entities),
    entityDefinitions
  );
}

function makeTestStorageArea<EntityDefinitionsType extends EntityDefinitions>(
  entities: EntitiesWithMetadata<EntityDefinitionsType>[]
): StorageArea {
  return makeStorageAreaFromBlockSequence([
    {
      entities: new Map<string, EntityWithMetadata>(
        entities.map((entity) => mapEntriesForEntity(entity))
      ),
    },
  ]);
}

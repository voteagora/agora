import { RuntimeType } from "../../serde";
import { BlockIdentifier } from "../../process/storageHandle";
import { IndexQueryArgs } from "../indexQueryArgs";
import { makeEntityKey } from "../keys/entityKey";

import { EntityDefinitions, IndexedValue, Reader } from "./type";

/**
 * Wraps a reader, caching results of point reads. This de-duplicates storage reads
 */
export class CachedReader<EntityDefinitionsType extends EntityDefinitions>
  implements Reader<EntityDefinitionsType>
{
  private readonly cache = new Map<string, Promise<any>>();

  constructor(private readonly reader: Reader<EntityDefinitionsType>) {}

  get entityDefinitions() {
    return this.reader.entityDefinitions;
  }

  getEntity<Entity extends keyof EntityDefinitionsType & string>(
    entity: Entity,
    id: string
  ): Promise<RuntimeType<EntityDefinitionsType[Entity]["serde"]> | null> {
    const entityKey = makeEntityKey(entity, id);
    const fromCache = this.cache.get(entityKey);
    if (fromCache) {
      return fromCache;
    }

    const promise = this.reader.getEntity(entity, id);
    this.cache.set(entityKey, promise);

    return promise;
  }

  getEntitiesByIndex<
    Entity extends keyof EntityDefinitionsType & string,
    IndexName extends keyof EntityDefinitionsType[Entity]["indexes"] & string
  >(
    entity: Entity,
    indexName: IndexName,
    args: IndexQueryArgs
  ): AsyncGenerator<
    IndexedValue<RuntimeType<EntityDefinitionsType[Entity]["serde"]>>
  > {
    return this.reader.getEntitiesByIndex(entity, indexName, args);
  }

  getLatestBlock(): BlockIdentifier {
    return this.reader.getLatestBlock();
  }
}

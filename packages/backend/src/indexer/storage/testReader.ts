import {
  EntityDefinitions,
  getEntitiesByIndexFromStorageArea,
  getEntityFromStorageArea,
  IndexedValue,
  IndexQueryArgs,
  Reader,
} from "./reader";
import { BlockIdentifier } from "../storageHandle";
import { RuntimeType } from "../serde";
import { StorageArea } from "../followChain";
import {
  EntitiesWithMetadata,
  EntityWithMetadata,
  mapEntriesForEntity,
} from "./entityStore";
import { makeStorageAreaFromBlockSequence } from "../testUtils";

export class TestReader<EntityDefinitionsType extends EntityDefinitions>
  implements Reader<EntityDefinitionsType>
{
  private readonly storageArea: StorageArea;
  private readonly entityDefinitions: EntityDefinitionsType;

  static create<T extends EntityDefinitions>(
    entityDefinitions: T,
    entities: EntitiesWithMetadata<T>[]
  ) {
    return new TestReader(makeTestStorageArea(entities), entityDefinitions);
  }

  constructor(
    storageArea: StorageArea,
    entityDefinitions: EntityDefinitionsType
  ) {
    this.storageArea = storageArea;
    this.entityDefinitions = entityDefinitions;
  }

  async *getEntitiesByIndex<
    Entity extends keyof EntityDefinitionsType & string,
    IndexName extends EntityDefinitionsType[Entity]["indexes"][0]["indexName"]
  >(
    entity: Entity,
    indexName: IndexName,
    args: IndexQueryArgs
  ): AsyncGenerator<
    IndexedValue<Readonly<RuntimeType<EntityDefinitionsType[Entity]["serde"]>>>
  > {
    yield* getEntitiesByIndexFromStorageArea(
      entity,
      this.entityDefinitions[entity],
      indexName,
      args,
      this.storageArea
    );
  }

  async getEntity<Entity extends keyof EntityDefinitionsType & string>(
    entity: Entity,
    id: string
  ): Promise<Readonly<
    RuntimeType<EntityDefinitionsType[Entity]["serde"]>
  > | null> {
    const fromStorage = getEntityFromStorageArea(
      this.storageArea,
      entity,
      this.entityDefinitions[entity],
      id
    );

    return fromStorage?.value ?? null;
  }

  getLatestBlock(): BlockIdentifier {
    return this.storageArea.tipBlock ?? this.storageArea.finalizedBlock;
  }
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

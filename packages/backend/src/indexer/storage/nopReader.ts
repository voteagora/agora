import { IndexedValue, IndexQueryArgs, Reader } from "./reader";
import { RuntimeType } from "../serde";
import { BlockIdentifier } from "../storageHandle";
import { StorageArea } from "../followChain";

export class NopReader implements Reader<any> {
  private readonly storageArea: StorageArea;
  constructor(storageArea: StorageArea) {
    this.storageArea = storageArea;
  }

  async *getEntitiesByIndex<
    Entity extends keyof any & string,
    IndexName extends any
  >(
    entity: Entity,
    indexName: IndexName,
    args: IndexQueryArgs
  ): AsyncGenerator<IndexedValue<Readonly<RuntimeType<any>>>> {}

  async getEntity<Entity extends keyof any & string>(
    entity: Entity,
    id: string
  ): Promise<Readonly<RuntimeType<any>> | null> {
    return null;
  }

  getLatestBlock(): BlockIdentifier {
    return this.storageArea.tipBlock ?? this.storageArea.finalizedBlock;
  }
}
import { RuntimeType } from "../../serde";
import { BlockIdentifier } from "../../process/storageHandle";
import { StorageArea } from "../../process/followChain";
import { IndexQueryArgs } from "../indexQueryArgs";

import { IndexedValue, Reader } from "./type";

export class NopReader implements Reader<any> {
  private readonly storageArea: StorageArea;
  constructor(storageArea: StorageArea) {
    this.storageArea = storageArea;
  }

  entityDefinitions: any;

  async *getEntitiesByIndex<
    Entity extends keyof any & string,
    IndexName extends any
  >(
    entity: Entity,
    indexName: IndexName,
    args: IndexQueryArgs
  ): AsyncGenerator<IndexedValue<RuntimeType<any>>> {}

  async getEntity<Entity extends keyof any & string>(
    entity: Entity,
    id: string
  ): Promise<RuntimeType<any> | null> {
    return null;
  }

  getLatestBlock(): BlockIdentifier {
    return this.storageArea.tipBlock ?? this.storageArea.finalizedBlock;
  }
}

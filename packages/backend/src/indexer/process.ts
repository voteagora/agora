import { ContractInstance, TypedInterface } from "../contracts";
import { ethers } from "ethers";
import { StorageHandle } from "./storageHandle";
import { RuntimeType, SerDe } from "./serde";

// The latest block is at depth zero with the block depth of each block below
// latest defined as LATEST.blockNumber - OTHER.blockNumber.
//
// maxReorgBlocksDepth indicates the number of blocks before a block is
// considered "finalized" and can not be reorganized out. Blocks for which
// depth is > maxReorgBlocksDepth are considered "finalized".
export const maxReorgBlocksDepth = 10;

export function isBlockDepthFinalized(depth: number) {
  return depth > maxReorgBlocksDepth;
}

export type EntitiesType = {
  [key: string]: EntityDefinition;
};

export type IndexerDefinition<
  InterfaceType extends TypedInterface = TypedInterface,
  Entities extends EntitiesType = EntitiesType
> = ContractInstance<InterfaceType> &
  IndexerDefinitionArgs<InterfaceType, Entities>;

type IndexerDefinitionArgs<
  InterfaceType extends TypedInterface,
  Entities extends EntitiesType
> = {
  /**
   * Name, used for logging and storing prefetched logs.
   */
  name: string;
  entities: Entities;
  eventHandlers: EventHandler<InterfaceType, Entities>[];
};

export type StorageHandleEntities<Entities extends EntitiesType> = {
  [K in keyof Entities]: RuntimeType<Entities[K]["serde"]>;
};

export type EntityDefinition<Type extends SerDe<any, any> = SerDe<any, any>> = {
  serde: Type;
  indexes: IndexDefinition<Type>[];
};

export type IndexDefinition<Type extends SerDe<any, any>> = {
  indexName: string;
  indexKey: (entity: RuntimeType<Type>) => string;
};

export type StorageHandleForIndexer<T extends IndexerDefinition> =
  StorageHandle<StorageHandleEntities<T["entities"]>>;

type EventHandler<
  InterfaceType extends TypedInterface,
  Entities extends EntitiesType
> = {
  [K in keyof InterfaceType["events"] & string]: {
    signature: K;
    handle: (
      handle: StorageHandle<StorageHandleEntities<Entities>>,
      event: ethers.utils.LogDescription<
        K,
        EventFragmentArg<InterfaceType["events"][K]>
      >,
      log: ethers.providers.Log
    ) => Promise<void> | void;
  };
}[keyof InterfaceType["events"] & string];

type EventFragmentArg<T> = T extends ethers.utils.EventFragment<infer Args>
  ? Args
  : never;

// todo: some mechanism for versioning

export function makeEntityDefinition<T extends SerDe<any, any>>(
  def: EntityDefinition<T>
): EntityDefinition<T> {
  return def;
}

export function makeIndexerDefinition<
  InterfaceType extends TypedInterface,
  Entities extends EntitiesType
>(
  contractInstance: ContractInstance<InterfaceType>,
  args: IndexerDefinitionArgs<InterfaceType, Entities>
): IndexerDefinition<InterfaceType, Entities> {
  return {
    ...contractInstance,
    ...args,
  };
}

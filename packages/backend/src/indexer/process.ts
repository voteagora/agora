import { ContractInstance, TypedInterface } from "../contracts";
import { ethers } from "ethers";
import { StorageHandle } from "./storageHandle";
import { governanceTokenIndexer } from "./contracts/GovernanceToken";

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

export type IndexerDefinition<
  InterfaceType extends TypedInterface,
  Entities
> = ContractInstance<InterfaceType> & {
  /**
   * Name, used for logging and storing prefetched logs.
   */
  name: string;
  indexes?: {
    [EntityKey in keyof Entities]?: {
      indexName: string;
      indexKey: (entity: Entities[EntityKey]) => string;
    }[];
  };
  eventHandlers: EventHandler<InterfaceType, Entities>[];
};

type EventHandler<InterfaceType extends TypedInterface, Entities> = {
  [K in keyof InterfaceType["events"] & string]: {
    signature: K;
    handle: (
      handle: StorageHandle<Entities>,
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

// todo: some mechanism for versioning this

export const optimismReducer = governanceTokenIndexer;

import { AbiEvent, AbiParametersToPrimitiveTypes } from "abitype";
import { ethers } from "ethers";
import { decodeEventLog, Hex } from "viem";
import { getEventSelector, formatAbiItem } from "viem/utils";

import * as serde from "../serde";
import { EntityDefinitions } from "../storage/reader/type";

import { AbiEvents } from "./contractInstance";
import { IndexerDefinition } from "./indexerDefinition";
import { stripInputNames } from "./stripEventArgNames";
import { EventDefinition } from "./filters";

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

export type EntityDefinition<
  Type extends serde.SerDe<any, any> = serde.SerDe<any, any>,
  Indexes extends Record<string, IndexDefinition<Type>> = Record<
    string,
    IndexDefinition<Type>
  >
> = {
  serde: Type;
  indexes: Indexes;
};

export type EntityRuntimeType<EntityDefinitionType extends EntityDefinition> =
  serde.RuntimeType<EntityDefinitionType["serde"]>;

export type IndexDefinition<Type extends serde.SerDe<any, any>> = {
  indexKey: (entity: serde.RuntimeType<Type>) => string;
};

// todo: some mechanism for versioning

export function makeEntityDefinition<
  Type extends serde.SerDe<any, any>,
  IndexType extends Record<string, IndexDefinition<Type>>
>(def: EntityDefinition<Type, IndexType>): EntityDefinition<Type, IndexType> {
  return def;
}

export function makeLogProcessor(
  indexers: IndexerDefinition[],
  log: ethers.providers.Log
) {
  const indexer = findIndexerForLog(indexers, log);
  const eventAbi = findEventAbiForLog(indexer, log);
  const args = decodeEventArgs(eventAbi, log);
  const handler = findEventHandlerForEvent(indexer, eventAbi);

  return {
    eventAbi,
    args,
    handler,
  };
}

function findIndexerForLog(
  indexers: IndexerDefinition[],
  log: ethers.providers.Log
) {
  const indexer = indexers.find(
    (it) => it.address.toLowerCase() === log.address.toLowerCase()
  );

  if (!indexer) {
    throw new Error(`No indexer found for log with address ${log.address}`);
  }

  return indexer;
}

function decodeEventArgs<TAbiEvent extends AbiEvent>(
  abiEvent: TAbiEvent,
  log: ethers.providers.Log
): AbiParametersToPrimitiveTypes<TAbiEvent["inputs"]> {
  return decodeEventLog({
    abi: [stripInputNames(abiEvent)],
    data: log.data as Hex,
    topics: log.topics as [Hex, ...Hex[]],
  }).args as any;
}

function eventSelectorForAbiEvent<TAbiEvent extends AbiEvent>(
  abiEvent: TAbiEvent
) {
  return getEventSelector(formatAbiItem(abiEvent) as EventDefinition);
}

function matchesTopic<TAbiEvent extends AbiEvent>(
  abiEvent: TAbiEvent,
  log: ethers.providers.Log
) {
  const selector = eventSelectorForAbiEvent(abiEvent);
  return log.topics[0] === selector;
}

function findEventAbiForLog<TAbiEvents extends AbiEvents>(
  indexer: IndexerDefinition<TAbiEvents>,
  log: ethers.providers.Log
): TAbiEvents[keyof TAbiEvents] {
  const eventAbi = Object.values(indexer.abiEvents).find((it) =>
    matchesTopic(it, log)
  );

  if (!eventAbi) {
    throw new Error(
      `No event ABI found for log with signature ${log.topics[0]}`
    );
  }

  return eventAbi as any;
}

function findEventHandlerForEvent<
  TAbiEvents extends AbiEvents,
  EntityDefinitionsType extends EntityDefinitions = EntityDefinitions
>(
  indexer: IndexerDefinition<TAbiEvents, EntityDefinitionsType>,
  event: TAbiEvents[keyof TAbiEvents]
) {
  const eventHandler = indexer.eventHandlers[event.name];

  if (!eventHandler) {
    throw new Error(
      `No event handler found for abi with event name ${event.name}`
    );
  }

  return eventHandler;
}

import { AbiEvent, AbiParametersToPrimitiveTypes } from "abitype";
import { ethers } from "ethers";

import { Prettify, UnionToIntersection } from "../../utils/unionToIntersection";
import { EntityDefinitions } from "../storage/reader/type";

import { AbiEvents, ContractInstance } from "./contractInstance";
import { StorageHandle } from "./storageHandle";
import { StripEventInputNames } from "./stripEventArgNames";

export type IndexerDefinition<
  TAbiEvents extends AbiEvents = AbiEvents,
  EntityDefinitionsType extends EntityDefinitions = EntityDefinitions
> = ContractInstance<TAbiEvents> &
  IndexerDefinitionArgs<TAbiEvents, EntityDefinitionsType> & {
    entityDefinitions: EntityDefinitionsType;
  };

type IndexerDefinitionArgs<
  TAbiEvents extends AbiEvents,
  EntityDefinitionsType extends EntityDefinitions
> = {
  /**
   * Name, used for logging and storing prefetched logs.
   */
  name: string;
  eventHandlers: EventHandlers<TAbiEvents, EntityDefinitionsType>;
};

export type EventHandlers<
  TAbiEvents extends AbiEvents,
  EntityDefinitionsType extends EntityDefinitions
> = {
  [TEventName in keyof TAbiEvents]?: EventHandlerType<
    TAbiEvents[TEventName],
    EntityDefinitionsType
  >;
};

type EventHandlerType<
  TAbiEvent extends AbiEvent,
  EntityDefinitionsType extends EntityDefinitions
> = {
  handle: (
    handle: StorageHandle<EntityDefinitionsType>,
    args: Readonly<
      AbiParametersToPrimitiveTypes<
        StripEventInputNames<TAbiEvent>["inputs"],
        "inputs"
      >
    >,
    log: ethers.providers.Log
  ) => Promise<void> | void;
};

export function makeIndexerDefinition<
  TAbiEvents extends AbiEvents,
  EntityDefinitionsType extends EntityDefinitions
>(
  contractInstance: ContractInstance<TAbiEvents>,
  entities: EntityDefinitionsType,
  args: IndexerDefinitionArgs<TAbiEvents, EntityDefinitionsType>
): IndexerDefinition<TAbiEvents, EntityDefinitionsType> {
  return {
    ...contractInstance,
    ...args,
    entityDefinitions: entities,
  };
}

/**
 * Explicitly widens the indexer definition to the base indexer definition type.
 *
 * This is necessary because a more specific IndexerDefinition is not
 * implicitly assignable to a less specific IndexerDefinition due to
 * IndexerDefinition's containing functions and functions with more specific
 * parameter types not being assignable to functions with less specific
 * parameter types.
 *
 * A function is assignable to (is a subtype of) another function if all of the
 * target parameters are assignable to the corresponding source parameters.
 *
 * Source: https://sammart.in/post/2021-07-25-typescript-function-type-parameter-contravariance/
 */
export function widenIndexerDefinition<
  TAbiEvents extends AbiEvents,
  EntityDefinitionsType extends EntityDefinitions
>(
  indexer: IndexerDefinition<TAbiEvents, EntityDefinitionsType>
): IndexerDefinition {
  // @ts-expect-error
  return indexer;
}

export function getIndexerByName(indexers: IndexerDefinition[], name: string) {
  const indexer = indexers.find((it) => it.name === name);
  if (!indexer) {
    throw new Error(
      `${indexer} not found, possible options ${indexers
        .map((indexer) => indexer.name)
        .join(", ")}`
    );
  }

  return indexer;
}

type EntityDefinitionsFromIndexerDefinitions<
  EntityDefinitionsType extends EntityDefinitions[]
> = Prettify<UnionToIntersection<EntityDefinitionsType[number]>>;

export function mergeEntityDefinitions<
  EntityDefinitionsType extends EntityDefinitions[]
>(
  entityDefinitionsType: EntityDefinitionsType
): EntityDefinitionsFromIndexerDefinitions<EntityDefinitionsType> {
  const entityDefinitions = entityDefinitionsType.flatMap((it) =>
    Object.entries(it)
  );

  return entityDefinitions.reduce<EntityDefinitions>((acc, [key, value]) => {
    if (key in acc) {
      const existing = acc[key];
      if (existing !== value) {
        throw new Error(
          `Entity definition for ${key} is not the same across indexers`
        );
      }

      return acc;
    } else {
      return {
        ...acc,
        [key]: value,
      };
    }
  }, {}) as any;
}

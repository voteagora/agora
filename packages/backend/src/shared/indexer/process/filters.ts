import { formatAbiItem, getEventSelector } from "viem/utils";

export type EventDefinition = `${string}(${string})`;

import { TopicFilter } from "../logProvider/logProvider";

import { AbiEvents, ContractInstance } from "./contractInstance";
import { IndexerDefinition } from "./indexerDefinition";

export function filterForEventHandlers<AbiEventsType extends AbiEvents>(
  instance: ContractInstance<AbiEventsType>,
  names: (keyof AbiEventsType)[]
): TopicFilter {
  return {
    address: [instance.address],
    topics: [topicsForSignatures(instance.abiEvents, names)],
  };
}

function topicsForSignatures<AbiEventsType extends AbiEvents>(
  events: AbiEventsType,
  names: (keyof AbiEventsType)[]
) {
  return names.map((name) => {
    const event = events[name];
    const definition = formatAbiItem(event);
    return getEventSelector(definition as EventDefinition);
  });
}

function combineTopicFilters(filters: TopicFilter[]) {
  return filters.reduce(combineTopicFilterPair, { address: [], topics: [] });
}

function combineTopicFilterPair(
  lhs: TopicFilter,
  rhs: TopicFilter
): TopicFilter {
  return {
    address: [...(lhs.address ?? []), ...(rhs.address ?? [])],
    topics: [...(lhs.topics ?? []), ...(rhs.topics ?? [])],
  };
}

export function topicFilterForIndexers(indexers: IndexerDefinition[]) {
  return combineTopicFilters(
    indexers.map((it) =>
      filterForEventHandlers(it, Object.keys(it.eventHandlers))
    )
  );
}

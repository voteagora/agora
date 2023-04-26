import { formatAbiItem, getEventSelector } from "viem/utils";

import { AbiEvents, ContractInstance } from "./contractInstance";
import { IndexerDefinition } from "./indexerDefinition";

export type EventDefinition = `${string}(${string})`;

/**
 * A normalized representation of a topic filter. A topic filter previously
 * represented as `[A]` is now represented as `[[A]]`, that is as an array with
 * a single item.
 */
export type TopicsType = string[][];

export type TopicFilter = {
  address?: string[];
  topics?: TopicsType;
};

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
    topics: mergeTopicFilters(lhs.topics ?? [], rhs.topics ?? []),
  };
}

export function mergeTopicFilters(a: TopicsType, b: TopicsType): TopicsType {
  const resultLength = Math.max(a.length, b.length);

  return Array.from(
    (function* () {
      for (let i = 0; i < resultLength; i++) {
        yield [...(a[i] ?? []), ...(b[i] ?? [])];
      }
    })()
  );
}

export function topicFilterForIndexers(indexers: IndexerDefinition[]) {
  return combineTopicFilters(
    indexers.map((it) =>
      filterForEventHandlers(it, Object.keys(it.eventHandlers))
    )
  );
}

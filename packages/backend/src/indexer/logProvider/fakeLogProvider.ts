import { ethers } from "ethers";

import {
  getBlockByHash,
  getBlocksByRange,
  FakeBlockProviderBlock,
} from "../blockProvider/fakeBlockProvider";

import { LogFilter, LogProvider, TopicFilter } from "./logProvider";

export function normalizeTopics(filter: TopicFilter) {
  if (!filter.topics) {
    return [];
  }

  return filter.topics.map((topicOrTopics) => {
    if (!Array.isArray(topicOrTopics)) {
      return [topicOrTopics];
    }

    return topicOrTopics;
  });
}

/**
 * Ensures a log matches a topic as determined by the topic filter matching
 * rules outlined in ethers.
 *
 * https://docs.ethers.org/v5/single-page/#/v5/concepts/events/-%23-events--filters
 *
 * @param normalizedTopics A list of normalized topics, can be obtained from
 *  {@link normalizeTopics}
 * @param log
 */
export function logMatchesTopics(
  normalizedTopics: string[][],
  log: ethers.providers.Log
): boolean {
  for (const [idx, segment] of normalizedTopics.entries()) {
    if (!segment.includes(log.topics[idx])) {
      return false;
    }
  }

  return true;
}

export class FakeLogProvider implements LogProvider {
  private readonly blocks: FakeBlockProviderBlock[];

  constructor(blocks: FakeBlockProviderBlock[]) {
    this.blocks = blocks;
  }

  async getLogs(filter: LogFilter): Promise<ethers.providers.Log[]> {
    const blocks = (() => {
      if ("fromBlock" in filter && "toBlock" in filter) {
        return getBlocksByRange(this.blocks, filter.fromBlock, filter.toBlock);
      }

      return [getBlockByHash(this.blocks, filter.blockHash)];
    })();

    const normalizedTopics = normalizeTopics(filter);

    const logs = blocks
      .flatMap((block) => block.logs)
      .filter((log) => {
        if (!filter.address) {
          return true;
        }

        return filter.address.includes(log.address);
      })
      .filter((log) => logMatchesTopics(normalizedTopics, log));

    return logs;
  }
}

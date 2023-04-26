import { ethers } from "ethers";

import {
  getBlockByHash,
  getBlocksByRange,
  FakeBlockProviderBlock,
} from "../blockProvider/fakeBlockProvider";
import { TopicsType } from "../process/topicFilters";

import { LogFilter, LogProvider } from "./logProvider";

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

    const normalizedTopics = filter.topics ?? [];

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

/**
 * Ensures a log matches a topic as determined by the topic filter matching
 * rules outlined in ethers.
 *
 * https://docs.ethers.org/v5/single-page/#/v5/concepts/events/-%23-events--filters
 */
function logMatchesTopics(
  normalizedTopics: TopicsType,
  log: ethers.providers.Log
): boolean {
  for (const [idx, segment] of normalizedTopics.entries()) {
    if (!segment.includes(log.topics[idx])) {
      return false;
    }
  }

  return true;
}

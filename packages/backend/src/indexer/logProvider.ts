import { ethers } from "ethers";
import { IndexerDefinition } from "./process";
import { topicsForSignatures } from "../contracts";

export type LogFilter = BlockSpec & TopicFilter;

export type TopicFilter = {
  address?: string[];
  topics?: Array<string> | Array<Array<string>>;
};

export type BlockSpec =
  | {
      fromBlock: number;
      toBlock: number;
    }
  | {
      blockHash: string;
    };

export function topicFilterForIndexers(
  indexers: IndexerDefinition[]
): TopicFilter {
  return {
    address: indexers.map((it) => it.address),
    topics: [
      indexers.flatMap((it) =>
        topicsForSignatures(
          it.iface,
          it.eventHandlers.map((handler) => handler.signature)
        )
      ),
    ],
  };
}

export interface LogProvider {
  getLogs(filter: LogFilter): Promise<ethers.providers.Log[]>;
}

export class EthersLogProvider implements LogProvider {
  private readonly provider: ethers.providers.AlchemyProvider;

  constructor(provider: ethers.providers.AlchemyProvider) {
    this.provider = provider;
  }

  async getLogs(filter: LogFilter): Promise<ethers.providers.Log[]> {
    return await this.provider.send("eth_getLogs", [
      {
        ...(() => {
          if (!("fromBlock" in filter)) {
            return {
              blockHash: filter.blockHash,
            };
          }

          return {
            fromBlock: ethers.BigNumber.from(filter.fromBlock).toHexString(),
            toBlock: ethers.BigNumber.from(filter.toBlock).toHexString(),
          };
        })(),
        address: filter.address,
        topics: filter.topics,
      },
    ]);
  }
}

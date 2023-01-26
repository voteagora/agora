import { ethers } from "ethers";
import { IndexerDefinition } from "./process";
import { topicsForSignatures } from "../contracts";
import { compareByTuple } from "./utils/sortUtils";

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

export function topicFilterForIndexers(indexers: IndexerDefinition[]) {
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
  private readonly provider: ethers.providers.JsonRpcProvider;

  constructor(provider: ethers.providers.JsonRpcProvider) {
    this.provider = provider;
  }

  async getLogs(filter: LogFilter): Promise<ethers.providers.Log[]> {
    const logs: ethers.providers.Log[] = await this.provider.send(
      "eth_getLogs",
      [
        {
          ...(() => {
            if (!("fromBlock" in filter)) {
              return {
                blockHash: filter.blockHash,
              };
            }

            return {
              fromBlock: ethers.utils.hexValue(
                ethers.BigNumber.from(filter.fromBlock)
              ),
              toBlock: ethers.utils.hexValue(
                ethers.BigNumber.from(filter.toBlock)
              ),
            };
          })(),
          address: filter.address,
          topics: filter.topics,
        },
      ]
    );

    return logs.sort(
      compareByTuple((it) => [it.blockNumber, it.transactionIndex, it.logIndex])
    );
  }
}

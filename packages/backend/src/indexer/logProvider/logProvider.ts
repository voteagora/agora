import { ethers } from "ethers";
import { IndexerDefinition } from "../process";
import { topicsForSignatures } from "../../contracts";
import { compareByTuple } from "../utils/sortUtils";
import { executeWithRetries } from "../utils/asyncUtils";
import * as serde from "../serde";

export type LogFilter = BlockSpec & TopicFilter;

export type TopicFilter = {
  address?: string[];
  topics?: Array<string | null> | Array<Array<string> | null>;
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
  /**
   * Returns a list of logs, sorted in ascending ordinal order
   * ({@link ethers.providers.Log#blockNumber},
   * {@link ethers.providers.Log#transactionIndex},
   * {@link ethers.providers.Log#logIndex}).
   */
  getLogs(filter: LogFilter): Promise<ethers.providers.Log[]>;
}

type Log = {
  address: string;
  blockHash: string;
  blockNumber: string;
  data: string;
  topics: string[];
  logIndex: string;
  transactionHash: string;
  transactionIndex: string;
};

// todo: use this in fetch too
// todo: move serialization / validation here

export class EthersLogProvider implements LogProvider {
  private readonly provider: ethers.providers.JsonRpcProvider;
  private readonly failImmediately: boolean;

  constructor(
    provider: ethers.providers.JsonRpcProvider,
    failImmediately: boolean = false
  ) {
    this.provider = provider;
    this.failImmediately = failImmediately;
  }

  async getLogs(filter: LogFilter): Promise<ethers.providers.Log[]> {
    const attemptFn = () =>
      this.provider.send("eth_getLogs", [
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
      ]);

    const logs: Log[] = this.failImmediately
      ? await attemptFn()
      : await executeWithRetries(attemptFn);

    const parsedLogs = logs.map((log) => logsSerde.deserialize(log));

    return parsedLogs.sort(
      compareByTuple((it) => [it.blockNumber, it.transactionIndex, it.logIndex])
    );
  }
}

const logsSerde: serde.De<ethers.providers.Log, Log> = serde.objectDe({
  blockNumber: serde.bigNumberParseNumber,
  blockHash: serde.string,
  transactionIndex: serde.bigNumberParseNumber,
  removed: serde.constantDe(false),
  address: serde.string,
  data: serde.string,
  topics: serde.array(serde.string),
  transactionHash: serde.string,
  logIndex: serde.bigNumberParseNumber,
});

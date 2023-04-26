import { promises as fs } from "fs";

import { ethers } from "ethers";

import {
  loadLastLog,
  logsDirectory,
  pathForLogs,
  writeLogIndex,
} from "../logStorage";
import { BlockIdentifier } from "../process/storageHandle";
import { maxReorgBlocksDepth } from "../process/process";
import { getAllLogsInRange } from "../logProvider/getAllLogsInRange";
import { EthersLogProvider, LogProvider } from "../logProvider/logProvider";
import { makeProgressBarWithRate } from "../../utils/progressBarUtils";
import { filterForEventHandlers } from "../process/topicFilters";
import {
  getIndexerByName,
  IndexerDefinition,
} from "../process/indexerDefinition";

type FetchArgs = {
  indexers: IndexerDefinition[];
  provider: ethers.providers.JsonRpcProvider;
  indexerName?: string;
  dataDirectory: string;
};

export async function fetch({
  indexers,
  provider,
  indexerName,
  dataDirectory,
}: FetchArgs) {
  const logProvider = new EthersLogProvider(provider, true);

  const lastSafeBlock = await (async () => {
    const latestBlock = await provider.getBlock("latest");
    const lastSafeBlockNumber = latestBlock.number - maxReorgBlocksDepth;

    return await provider.getBlock(lastSafeBlockNumber);
  })();

  await fs.mkdir(logsDirectory(dataDirectory), { recursive: true });

  if (indexerName) {
    const indexer = getIndexerByName(indexers, indexerName);
    await fetchForIndexer(indexer, logProvider, dataDirectory, lastSafeBlock);
  } else {
    for (const indexer of indexers) {
      await fetchForIndexer(indexer, logProvider, dataDirectory, lastSafeBlock);
    }
  }
}

async function fetchForIndexer(
  indexer: IndexerDefinition,
  logProvider: LogProvider,
  dataDirectory: string,
  endBlock: ethers.providers.Block
) {
  const filter = filterForEventHandlers(
    indexer,
    Object.keys(indexer.eventHandlers)
  );

  console.log(`fetching ${indexer.name}`);
  const highestLog = await loadLastLog(indexer, dataDirectory);

  const fromBlock = highestLog
    ? highestLog.blockNumber + 1
    : indexer.startingBlock;

  const logsGenerator = getAllLogsInRange(
    logProvider,
    filter,
    fromBlock,
    endBlock.number
  );

  await fs.mkdir(logsDirectory(dataDirectory), { recursive: true });
  const logFile = await fs.open(pathForLogs(indexer, dataDirectory), "a+");

  const progressBar = makeProgressBarWithRate(endBlock.number);

  for await (const { logs, fromBlock, toBlock } of logsGenerator) {
    const pageSize = toBlock - fromBlock + 1;
    progressBar.tick({
      tickValue: toBlock,
    });

    for (const log of logs) {
      await logFile.write(JSON.stringify(log) + "\n");
    }
  }

  const latestBlockIdentifier: BlockIdentifier = {
    blockNumber: endBlock.number,
    hash: endBlock.hash,
  };

  await writeLogIndex(indexer, latestBlockIdentifier, dataDirectory);

  await logFile.close();
}

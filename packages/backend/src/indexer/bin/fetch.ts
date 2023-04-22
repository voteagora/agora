import { promises as fs } from "fs";

import { ethers } from "ethers";
import ProgressBar from "progress";

import { filterForEventHandlers } from "../../contracts";
import { makeProvider } from "../../provider";
import { getIndexerByName, indexers } from "../contracts";
import { getAllLogsInRange } from "../logProvider/getAllLogsInRange";
import { EthersLogProvider } from "../logProvider/logProvider";
import { loadLastLog, pathForLogs, pathForLogsIndex } from "../logStorage";
import { maxReorgBlocksDepth } from "../process";
import { BlockIdentifier } from "../storageHandle";

function makeFetchProgressBar(total: number) {
  return new ProgressBar(
    ":elapseds [:current/:total] :bar :percent @ :rate/s (:pageSize pp) :etas remaining",
    {
      total,
    }
  );
}

async function main() {
  const provider = makeProvider();

  const logProvider = new EthersLogProvider(provider, true);

  const indexer = getIndexerByName(indexers, process.argv[2]);

  const filter = filterForEventHandlers(
    indexer,
    indexer.eventHandlers.map((handler) => handler.signature)
  );

  const latestBlock = await provider.getBlock("latest");
  const lastSafeBlockNumber = latestBlock.number - maxReorgBlocksDepth;

  const lastSafeBlock = await provider.getBlock(lastSafeBlockNumber);

  const highestLog = await loadLastLog(indexer);

  const fromBlock = highestLog
    ? highestLog.blockNumber + 1
    : indexer.startingBlock;

  const logsGenerator = getAllLogsInRange(
    logProvider,
    filter,
    fromBlock,
    lastSafeBlockNumber
  );

  const logFile = await fs.open(pathForLogs(indexer), "a+");

  const progressBar = makeFetchProgressBar(lastSafeBlockNumber);

  for await (const { logs, fromBlock, toBlock } of logsGenerator) {
    const pageSize = toBlock - fromBlock + 1;
    progressBar.tick(toBlock - progressBar.curr + 1, { pageSize });

    for (const log of logs) {
      await logFile.write(JSON.stringify(log) + "\n");
    }
  }

  const latestBlockIdentifier: BlockIdentifier = {
    blockNumber: lastSafeBlock.number,
    hash: lastSafeBlock.hash,
  };

  await fs.writeFile(
    pathForLogsIndex(indexer),
    JSON.stringify(latestBlockIdentifier)
  );
}

main();

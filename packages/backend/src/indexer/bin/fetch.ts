import { ethers } from "ethers";
import { loadLastLog, pathForLogs, pathForLogsIndex } from "../logStorage";
import { getAllLogsGenerator } from "../../events";
import { promises as fs } from "fs";
import { BlockIdentifier } from "../storageHandle";
import { filterForEventHandlers } from "../../contracts";
import { indexers } from "../contracts";
import { maxReorgBlocksDepth } from "../process";

async function main() {
  const provider = new ethers.providers.AlchemyProvider(
    "mainnet",
    process.env.ALCHEMY_API_KEY
  );

  const indexer = indexers.find((it) => it.name === process.argv[2]);
  if (!indexer) {
    throw new Error(
      `${indexer} not found, possible options ${indexers
        .map((indexer) => indexer.name)
        .join(", ")}`
    );
  }

  const filter = filterForEventHandlers(
    indexer,
    indexer.eventHandlers.map((handler) => handler.signature)
  );

  const latestBlock = await provider.getBlock("latest");
  const lastSafeBlockNumber = latestBlock.number - maxReorgBlocksDepth;

  const lastSafeBlock = await provider.getBlock(lastSafeBlockNumber);

  const highestLog = await loadLastLog(indexer);

  const logsGenerator = getAllLogsGenerator(
    provider,
    filter,
    lastSafeBlockNumber,
    highestLog ? highestLog.blockNumber + 1 : indexer.startingBlock
  );

  const logFile = await fs.open(pathForLogs(indexer), "a+");

  for await (const logs of logsGenerator) {
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

import { ethers } from "ethers";
import { maxReorgBlocksDepth, optimismReducer } from "../process";
import { loadLastLog, pathForLogs, pathForLogsIndex } from "../logStorage";
import { getAllLogsGenerator } from "../../events";
import { promises as fs } from "fs";
import { BlockIdentifier } from "../storageHandle";
import { filterForEventHandlers } from "../../contracts";

async function main() {
  const provider = new ethers.providers.AlchemyProvider(
    "optimism",
    process.env.ALCHEMY_API_KEY
  );

  const filter = filterForEventHandlers(
    optimismReducer,
    optimismReducer.eventHandlers.map((handler) => handler.signature)
  );

  const latestBlock = await provider.getBlock("latest");
  const lastSafeBlockNumber = latestBlock.number - maxReorgBlocksDepth;

  const lastSafeBlock = await provider.getBlock(lastSafeBlockNumber);

  const highestLog = await loadLastLog(optimismReducer);

  const logsGenerator = getAllLogsGenerator(
    provider,
    filter,
    lastSafeBlockNumber,
    highestLog ? highestLog.blockNumber + 1 : optimismReducer.startingBlock
  );

  const logFile = await fs.open(pathForLogs(optimismReducer), "a+");

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
    pathForLogsIndex(optimismReducer),
    JSON.stringify(latestBlockIdentifier)
  );
}

main();

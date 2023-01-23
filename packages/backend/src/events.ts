import { ethers } from "ethers";

export async function* getAllLogsGenerator(
  provider: ethers.providers.Provider,
  filter: ethers.EventFilter,
  latestBlockNumber: number,
  startBlock: number
) {
  let fromBlock = startBlock;

  while (fromBlock < latestBlockNumber) {
    console.log({ fromBlock, latestBlockNumber });
    const { toBlock, logs } = await getLogPage(
      provider,
      filter,
      fromBlock,
      latestBlockNumber
    );
    yield logs;

    fromBlock = toBlock + 1;
  }
}

const maxBlocksPerPage = 10_000;

async function getLogPage(
  provider: ethers.providers.Provider,
  filter: ethers.EventFilter,
  fromBlock: number,
  latestBlockNumber: number
): Promise<{
  logs: ethers.providers.Log[];

  // The last block fetched.
  toBlock: number;
}> {
  if (fromBlock >= latestBlockNumber) {
    return {
      toBlock: fromBlock,
      logs: [],
    };
  }

  let pageSize = maxBlocksPerPage;
  while (true) {
    if (pageSize === 0) {
      // todo: this does not account for a boundary condition
      throw new Error("failed to retrieve many pages");
    }

    const toBlock = Math.min(fromBlock + pageSize, latestBlockNumber);
    try {
      const logs = await provider.getLogs({
        ...filter,
        fromBlock,
        toBlock,
      });

      return {
        logs,
        toBlock,
      };
    } catch (e) {
      if (!(e instanceof Error)) {
        throw e;
      }

      if (!e.message.includes("response size exceeded")) {
        throw e;
      }

      pageSize = Math.floor(pageSize / 2);
    }
  }
}

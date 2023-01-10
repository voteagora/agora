import { ethers } from "ethers";

export async function* getAllLogs(
  provider: ethers.providers.Provider,
  filter: ethers.EventFilter,
  toBlockInclusive: number,
  fromBlockInclusive: number
) {
  let fromBlock = fromBlockInclusive;

  while (fromBlock <= toBlockInclusive) {
    console.log({ fromBlock, toBlockInclusive });
    const { lastBlockFetched, logs } = await getLogPage(
      provider,
      filter,
      fromBlock,
      toBlockInclusive + 1
    );

    yield logs;

    fromBlock = lastBlockFetched + 1;
  }
}

const maxBlocksPerPage = 10_000;

async function getLogPage(
  provider: ethers.providers.Provider,
  filter: ethers.EventFilter,
  fromBlockInclusive: number,
  toBlockExclusive: number
): Promise<{
  logs: ethers.providers.Log[];

  // The last block fetched.
  lastBlockFetched: number;
}> {
  let pageSize = maxBlocksPerPage;
  while (true) {
    if (pageSize === 0) {
      throw new Error("failed to retrieve many pages");
    }

    // at this point:
    // * toBlockExclusive > fromBlockInclusive
    // * pageSize > 0
    const toBlock = Math.min(fromBlockInclusive + pageSize, toBlockExclusive);

    // for:
    //   rangeSize = toBlock - fromBlockInclusive
    // then:
    //  rangeSize is always >= 1

    try {
      const logs = await provider.getLogs({
        ...filter,
        fromBlock: fromBlockInclusive,
        toBlock: toBlock - 1,
      });

      return {
        logs,
        lastBlockFetched: toBlock - 1,
      };
    } catch (e) {
      if (
        !e.message.includes("response size exceeded") &&
        !e.message.includes("Consider reducing your block range")
      ) {
        throw e;
      }

      pageSize = Math.floor(pageSize / 2);
      console.log({ pageSize });
    }
  }
}

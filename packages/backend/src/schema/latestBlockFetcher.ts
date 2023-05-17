import { BigNumber, ethers } from "ethers";

export type LatestBlockFetcher = {
  getLatestBlockNumber(): Promise<BigNumber>;
};

export function makeLatestBlockFetcher(
  provider: ethers.providers.JsonRpcProvider
): LatestBlockFetcher {
  let lastFetchedPromise: Promise<BigNumber> | null = null;

  return {
    getLatestBlockNumber(): Promise<BigNumber> {
      if (lastFetchedPromise) {
        return lastFetchedPromise;
      }

      const promise = (async () => {
        const block = await provider.getBlock("latest");

        return BigNumber.from(block.number - 5);
      })();

      lastFetchedPromise = promise;

      return promise;
    },
  };
}

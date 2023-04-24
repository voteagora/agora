import { ethers } from "ethers";

export type LatestBlockFetcher = {
  getLatestBlock(): Promise<ethers.providers.Block>;
};

export function makeLatestBlockFetcher(
  provider: ethers.providers.JsonRpcProvider
): LatestBlockFetcher {
  let lastFetchedPromise: Promise<ethers.providers.Block> | null = null;

  return {
    getLatestBlock(): Promise<ethers.providers.Block> {
      if (lastFetchedPromise) {
        return lastFetchedPromise;
      }

      const promise = provider.getBlock("latest");

      lastFetchedPromise = promise;

      return promise;
    },
  };
}

import { ethers } from "ethers";
import { EASDataFetcher, easDataFetcher } from "./easDataFetcher";
import { AsyncDataFetcher, asyncDataFetcher } from "./asyncDataFetcher";

export type DataFetcher = {
  asyncDataFetcher: AsyncDataFetcher;
  easDataFetcher: EASDataFetcher;
};

export function makeDataFetcher(
  provider: ethers.providers.BaseProvider
): DataFetcher {
  return {
    asyncDataFetcher: asyncDataFetcher(),
    easDataFetcher: easDataFetcher(provider),
  };
}

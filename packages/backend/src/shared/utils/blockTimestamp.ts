import { ethers } from "ethers";

const secondsPerBlock = 12;

export function approximateTimeStampForBlock(
  block: number,
  latestBlock: ethers.providers.Block
) {
  return new Date(
    (latestBlock.timestamp + secondsPerBlock * (block - latestBlock.number)) *
      1000
  );
}

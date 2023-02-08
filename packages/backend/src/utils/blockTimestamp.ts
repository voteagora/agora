import { ethers } from "ethers";

const secondsPerBlock = 12;

export async function approximateBlockTimestampForBlock(
  provider: ethers.providers.BaseProvider,
  blockNumber: number
) {
  const block = await provider.getBlock(blockNumber.toString());
  if (block) {
    return block.timestamp;
  }

  const latestBlock = await provider.getBlock("latest");
  const blockDelta = blockNumber - latestBlock.number;

  return latestBlock.timestamp + blockDelta * secondsPerBlock;
}

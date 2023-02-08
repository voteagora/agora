import { ethers } from "ethers";

const secondsPerBlock = 12;

export async function approximateBlockTimestampForBlock(
  provider: ethers.providers.BaseProvider,
  blockNumber: number
): Promise<Date> {
  const block = await provider.getBlock(blockNumber);
  if (block) {
    return new Date(block.timestamp * 1000);
  }

  const latestBlock = await provider.getBlock("latest");
  const blockDelta = blockNumber - latestBlock.number;

  return new Date(
    (latestBlock.timestamp + blockDelta * secondsPerBlock) * 1000
  );
}

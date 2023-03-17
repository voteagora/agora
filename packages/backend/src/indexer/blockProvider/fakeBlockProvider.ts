import { ethers } from "ethers";

import { findLastIndex } from "../../utils/array";

import { BlockProvider, BlockProviderBlock } from "./blockProvider";

export type FakeBlockProviderBlock = {
  block: BlockProviderBlock;
  logs: ethers.providers.Log[];
};

export function getBlockByHash(blocks: FakeBlockProviderBlock[], hash: string) {
  const foundBlock = blocks.find((block) => block.block.hash === hash);
  if (!foundBlock) {
    throw new Error(`could not find block with hash: ${hash}`);
  }

  return foundBlock;
}

export function getBlocksByRange(
  blocks: FakeBlockProviderBlock[],
  fromBlockInclusive: number,
  toBlockInclusive: number
) {
  const fromBlockIndex = blocks.findIndex(
    (block) => block.block.number >= fromBlockInclusive
  );
  const toBlockIndex = findLastIndex(
    blocks,
    (block) => block.block.number <= toBlockInclusive
  );

  return blocks.slice(fromBlockIndex, toBlockIndex + 1);
}

export class FakeBlockProvider implements BlockProvider {
  private readonly blocks: FakeBlockProviderBlock[];

  constructor(blocks: FakeBlockProviderBlock[]) {
    this.blocks = blocks;
  }

  async getBlockByHash(hash: string): Promise<BlockProviderBlock> {
    return getBlockByHash(this.blocks, hash).block;
  }

  async getBlockByNumber(number: number): Promise<BlockProviderBlock | null> {
    const foundBlock = this.blocks.find(
      (block) => block.block.number === number
    );
    return foundBlock?.block ?? null;
  }

  async getLatestBlock(): Promise<BlockProviderBlock> {
    if (!this.blocks.length) {
      throw new Error("no blocks");
    }

    return this.blocks[this.blocks.length - 1].block;
  }
}

import { ethers } from "ethers";
import { BlockIdentifier } from "./storageHandle";

export type BlockProviderBlock = {
  number: number;
  parentHash: string;
  logsBloom: string;
  hash: string;
};

export interface BlockProvider {
  getBlockByHash(hash: string): Promise<BlockProviderBlock>;
  getBlockByNumber(number: number): Promise<BlockProviderBlock | null>;
  getLatestBlock(): Promise<BlockProviderBlock>;
  getBlockRange(
    fromBlockInclusive: number,
    toBlockInclusive: number
  ): Promise<BlockProviderBlock[]>;
}

export const maxBlockRange = 1000;

export class BlockProviderImpl implements BlockProvider {
  private provider: ethers.providers.AlchemyProvider;

  constructor(provider: ethers.providers.AlchemyProvider) {
    this.provider = provider;
  }

  async getBlockByHash(hash: string): Promise<BlockProviderBlock> {
    const raw = await this.provider.send("eth_getBlockByHash", [hash, false]);
    if (!raw) {
      throw new Error(`unknown block hash ${hash}`);
    }

    return transformResponse(raw);
  }

  async getBlockRange(
    fromBlockInclusive: number,
    toBlockInclusive: number
  ): Promise<BlockProviderBlock[]> {
    const blocks: any[] = await this.provider.send("eth_getBlockRange", [
      toHexNumber(fromBlockInclusive),
      toHexNumber(toBlockInclusive),
      false,
    ]);

    return blocks
      .map((block) => transformResponse(block))
      .sort((a, b) => a.number - b.number);
  }

  async getBlockByNumber(number: number): Promise<BlockProviderBlock> {
    const raw = await this.provider.send("eth_getBlockByNumber", [
      ethers.BigNumber.from(number).toHexString(),
      false,
    ]);
    return transformResponse(raw);
  }

  async getLatestBlock(): Promise<BlockProviderBlock> {
    const raw = await this.provider.send("eth_getBlockByNumber", [
      "latest",
      false,
    ]);
    return transformResponse(raw);
  }
}

export function blockIdentifierFromParentBlock(
  block: BlockProviderBlock
): BlockIdentifier {
  return {
    hash: block.parentHash,
    blockNumber: block.number - 1,
  };
}

export function blockIdentifierFromBlock(block: BlockProviderBlock) {
  return {
    hash: block.hash,
    blockNumber: block.number,
  };
}

function transformResponse(raw: any): BlockProviderBlock {
  return {
    hash: raw.hash,
    logsBloom: raw.logsBloom,
    parentHash: raw.parentHash,
    number: ethers.BigNumber.from(raw.number).toNumber(),
  };
}

function toHexNumber(number: number) {
  return `0x${number.toString(16)}`;
}

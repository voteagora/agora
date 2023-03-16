import { ethers } from "ethers";
import { BlockIdentifier } from "../storageHandle";
import { compareBy } from "../utils/sortUtils";
import { executeWithRetries } from "../utils/asyncUtils";

export type BlockProviderBlock = {
  number: number;
  parentHash: string;
  hash: string;
};

export interface BlockProvider {
  getBlockByHash(hash: string): Promise<BlockProviderBlock>;
  getBlockByNumber(number: number): Promise<BlockProviderBlock | null>;
  getLatestBlock(): Promise<BlockProviderBlock>;

  /**
   * Returns a list of blocks, sorted in ascending order of
   * {@link BlockProviderBlock#number}.
   */
  getBlockRange(
    fromBlockInclusive: number,
    toBlockInclusive: number
  ): Promise<BlockProviderBlock[]>;
}

export const maxBlockRange = 1000;

export class EthersBlockProvider implements BlockProvider {
  private provider: ethers.providers.JsonRpcProvider;

  constructor(provider: ethers.providers.JsonRpcProvider) {
    this.provider = provider;
  }

  async getBlockByHash(hash: string): Promise<BlockProviderBlock> {
    const raw = await executeWithRetries(() =>
      this.provider.send("eth_getBlockByHash", [hash, false])
    );
    if (!raw) {
      throw new Error(`unknown block hash ${hash}`);
    }

    return transformResponse(raw);
  }

  async getBlockRange(
    fromBlockInclusive: number,
    toBlockInclusive: number
  ): Promise<BlockProviderBlock[]> {
    const blocks: any[] = await executeWithRetries(() =>
      this.provider.send("eth_getBlockRange", [
        toHexNumber(fromBlockInclusive),
        toHexNumber(toBlockInclusive),
        false,
      ])
    );

    return blocks
      .map((block) => transformResponse(block))
      .sort(compareBy((it) => it.number));
  }

  async getBlockByNumber(number: number): Promise<BlockProviderBlock> {
    const raw = await executeWithRetries(() =>
      this.provider.send("eth_getBlockByNumber", [
        ethers.BigNumber.from(number).toHexString(),
        false,
      ])
    );
    return transformResponse(raw);
  }

  async getLatestBlock(): Promise<BlockProviderBlock> {
    const raw = await executeWithRetries(() =>
      this.provider.send("eth_getBlockByNumber", ["latest", false])
    );
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
    parentHash: raw.parentHash,
    number: ethers.BigNumber.from(raw.number).toNumber(),
  };
}

function toHexNumber(number: number) {
  return `0x${number.toString(16)}`;
}

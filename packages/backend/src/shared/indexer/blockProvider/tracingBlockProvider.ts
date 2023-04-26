import { trace } from "../../workers/datadogTracer/contextSpan";
import { flattenMetaInputType } from "../../workers/datadogTracer/flatten";

import { BlockProvider, BlockProviderBlock } from "./blockProvider";

const name = "BlockProvider";

/**
 * BlockProvider wrapping all operations with tracing.
 */
export class TracingBlockProvider implements BlockProvider {
  constructor(private readonly blockProvider: BlockProvider) {}

  async getBlockByHash(hash: string): Promise<BlockProviderBlock> {
    return await trace(
      {
        name,
        resource: "BlockProvider.getBlockByHash",
        meta: flattenMetaInputType({
          args: {
            hash,
          },
        }),
      },
      () => this.blockProvider.getBlockByHash(hash)
    );
  }

  async getBlockByNumber(number: number): Promise<BlockProviderBlock | null> {
    return await trace(
      {
        name,
        resource: "BlockProvider.getBlockByNumber",
        meta: flattenMetaInputType({
          args: {
            number,
          },
        }),
      },
      () => this.blockProvider.getBlockByNumber(number)
    );
  }

  async getLatestBlock(): Promise<BlockProviderBlock> {
    return await trace(
      {
        name,
        resource: "BlockProvider.getLatestBlock",
      },
      () => this.blockProvider.getLatestBlock()
    );
  }
}

import { ethers } from "ethers";
import { TransactionRequest } from "@ethersproject/abstract-provider";
import DataLoader from "dataloader";

import { Multicall3__factory } from "./contracts/generated";

export class TransparentMultiCallProvider extends ethers.providers
  .BaseProvider {
  private provider: ethers.providers.BaseProvider;
  private callDataLoader: CallDataLoader;

  constructor(underlyingProvider: ethers.providers.BaseProvider) {
    super(underlyingProvider.getNetwork());
    this.callDataLoader = new CallDataLoader(underlyingProvider);
    this.provider = underlyingProvider;
  }

  async detectNetwork() {
    return await this.provider.detectNetwork();
  }

  async perform(method: string, params: { [name: string]: any }): Promise<any> {
    if (method === "call") {
      const callParams: { transaction: TransactionRequest; blockTag: string } =
        params as any;

      if (callParams.blockTag === "latest") {
        const result = await this.callDataLoader.load({
          data: ethers.utils.hexlify(callParams.transaction.data!),
          target: callParams.transaction.to!,
        });

        return result.returnData;
      }
    }

    return this.provider.perform(method, params);
  }
}

type CallRequest = {
  target: string;
  data: string;
};

type CallResult = {
  success: boolean;
  returnData: string;
};

function makeMultiCall3(provider: ethers.providers.Provider) {
  return Multicall3__factory.connect(
    "0xcA11bde05977b3631167028862bE2a173976CA11",
    provider
  );
}

class CallDataLoader extends DataLoader<CallRequest, CallResult, string> {
  constructor(provider: ethers.providers.Provider) {
    const multiCall = makeMultiCall3(provider);

    super(
      async (batch) =>
        await multiCall.callStatic.aggregate3(
          batch.map((item) => ({
            callData: item.data,
            target: item.target,
            allowFailure: true,
          })),
          {
            blockTag: "latest",
          }
        ),
      {
        batch: true,
        cache: true,
        cacheKeyFn: (item) => [item.target, item.data].join("|"),
      }
    );
  }
}

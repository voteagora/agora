// todo: this is copy paste of stuff in backend

import { ethers } from "ethers";
import { Multicall2__factory } from "./contracts/generated";
import DataLoader from "dataloader";

type CallRequest = {
  target: string;
  data: string;
};

type CallResult = {
  success: boolean;
  returnData: string;
};

function makeMultiCall2(provider: ethers.providers.Provider) {
  return Multicall2__factory.connect(
    "0x5ba1e12693dc8f9c48aad8770482f4739beed696",
    provider
  );
}

class CallDataLoader extends DataLoader<CallRequest, CallResult, string> {
  constructor(provider: ethers.providers.Provider) {
    const multiCall = makeMultiCall2(provider);

    super(
      async (batch) => {
        return await multiCall.callStatic.tryAggregate(
          false,
          batch.map((item) => ({
            callData: item.data,
            target: item.target,
          })),
          {
            blockTag: "latest",
          }
        );
      },
      {
        batch: true,
        cache: true,
        cacheKeyFn: (item) => [item.target, item.data].join("|"),
      }
    );
  }
}

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
      const callParams: {
        transaction: { data: string; to: string };
        blockTag: string;
      } = params as any;

      if (callParams.blockTag === "latest") {
        const result = await this.callDataLoader.load({
          data: ethers.utils.hexlify(callParams.transaction.data),
          target: callParams.transaction.to,
        });

        if (!result.success) {
          throw new Error("failed");
        }

        return result.returnData;
      }
    }

    return this.provider.perform(method, params);
  }
}

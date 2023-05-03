import { ethers } from "ethers";

import { trace } from "./workers/datadogTracer/contextSpan";

export class TracingProvider extends ethers.providers.BaseProvider {
  constructor(
    private readonly underlyingProvider: ethers.providers.BaseProvider
  ) {
    super(underlyingProvider.network);
  }

  detectNetwork(): Promise<ethers.providers.Network> {
    return this.underlyingProvider.detectNetwork();
  }

  async perform(method: string, params: any): Promise<any> {
    return await trace(
      {
        service: "jsonrpc",
        name: "Provider",
        resource: method,
      },
      async () => await this.underlyingProvider.perform(method, params)
    );
  }
}

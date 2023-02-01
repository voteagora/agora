declare module "limiter" {
  export class RateLimiter {
    constructor(args: { tokensPerInterval: number; interval: number });

    removeTokens(tokensCount: number): Promise<void>;
  }
}

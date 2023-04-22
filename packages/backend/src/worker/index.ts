import { StorageDurableObjectV1 as StorageDurableObjectV1Implementation } from "./durableObject";
import { Env } from "./env";
import { fetch } from "./fetch";
import { makeToucanOptions, wrapModuleSentry } from "./sentry";

const sentryWrappedModule = wrapModuleSentry(makeToucanOptions, (sentry) => ({
  async fetch(request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return await fetch(request, env, ctx);
  },
}));

export default {
  ...sentryWrappedModule,
  scheduled: sentryWrappedModule.scheduled,
};

export { StorageDurableObjectV1Implementation as StorageDurableObjectV1 };

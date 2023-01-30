import { makeToucanOptions, wrapModuleSentry } from "./sentry";
import { Env } from "./env";
import { wrapModule } from "@cloudflare/workers-honeycomb-logger";
import { scheduled } from "./scheduled";
import { fetch } from "./fetch";

const sentryWrappedModule = wrapModuleSentry(makeToucanOptions, (sentry) => ({
  async fetch(request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return await fetch(request, env, ctx);
  },

  async scheduled(controller, env) {
    return await scheduled(controller.cron, env, sentry);
  },
}));

export default {
  ...wrapModule({}, sentryWrappedModule),
  scheduled: sentryWrappedModule.scheduled,
};

export { StorageDurableObjectV1 } from "./durableObject";

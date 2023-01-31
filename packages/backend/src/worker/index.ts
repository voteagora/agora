import { makeToucanOptions, wrapModuleSentry } from "./sentry";
import { Env } from "./env";
import {
  wrapModule,
  wrapDurableObject,
} from "@cloudflare/workers-honeycomb-logger";
import { scheduled } from "./scheduled";
import { fetch } from "./fetch";
import { StorageDurableObjectV1 as StorageDurableObjectV1Implementation } from "./durableObject";

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

export const StorageDurableObjectV1 = wrapDurableObject(
  {},
  StorageDurableObjectV1Implementation as any
);

import { wrapModuleSentry } from "./sentry";
import { Env } from "./env";
import { wrapModule } from "@cloudflare/workers-honeycomb-logger";
import { fetch } from "./fetch";

const sentryWrappedModule = wrapModuleSentry(
  ({ env, ctx }) => ({
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT,
    release: env.GITHUB_SHA,
    context: ctx,
    rewriteFrames: {
      root: "/",
    },
  }),
  (sentry) => ({
    async fetch(request, env: Env, ctx: ExecutionContext): Promise<Response> {
      return await fetch(request, env, ctx, sentry);
    },
  })
);

export default {
  ...wrapModule({}, sentryWrappedModule),
  scheduled: sentryWrappedModule.scheduled,
};

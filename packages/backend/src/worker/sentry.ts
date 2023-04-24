import { RewriteFrames } from "@sentry/integrations";

import { makeOptionsFnFactory } from "../shared/workers/sentry/makeOptions";

import { Env } from "./env";

export const makeToucanOptions = makeOptionsFnFactory<Env>(
  function makeToucanOptions({ env, ctx }) {
    return {
      options: {
        dsn: env.SENTRY_DSN,
        environment: env.ENVIRONMENT,
        release: env.GITHUB_SHA,
        context: ctx,
        integrations: [new RewriteFrames({ root: "/" })],
      },
      tags: {
        deployment: env.DEPLOYMENT,
      },
    };
  }
);

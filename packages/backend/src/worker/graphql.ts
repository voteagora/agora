import { Env } from "./env";
import { makeGatewaySchema } from "../schema";
import { AgoraContextType } from "../model";
import { makeEmailStorage, makeStatementStorage } from "./storage";
import { parseStorage } from "../snapshot";
import { getOrInitializeLatestSnapshot, loadSnapshot } from "./snapshot";
import { ExpiringCache } from "../utils/cache";

// Initializing the schema takes about 250ms. We should avoid doing it once
// per request. We need to move this calculation into some kind of compile time
// step.
let gatewaySchema = null;

export async function getGraphQLCallingContext(
  request: Request,
  env: Env,
  ctx: ExecutionContext
) {
  if (!gatewaySchema) {
    gatewaySchema = makeGatewaySchema();
  }

  const latestSnapshot = await getOrInitializeLatestSnapshot(async () => {
    const snapshot = await loadSnapshot(env);
    return parseStorage(snapshot);
  });

  const context: AgoraContextType = {
    snapshot: latestSnapshot,
    statementStorage: makeStatementStorage(env.STATEMENTS),
    emailStorage: makeEmailStorage(env.EMAILS),
    tracingContext: {
      spanMap: new Map(),
      rootSpan: request.tracer,
    },
    cache: {
      cache: makeCacheFromKvNamespace(env.APPLICATION_CACHE),
      waitUntil(promise) {
        return ctx.waitUntil(promise);
      },
      span: request.tracer,
    },
  };

  return {
    schema: gatewaySchema,
    context,
  };
}

function makeCacheFromKvNamespace(kvNamespace: KVNamespace): ExpiringCache {
  return {
    async get(key: string): Promise<string | null> {
      return await kvNamespace.get(key);
    },
    async put(key: string, value: string): Promise<void> {
      await kvNamespace.put(key, value, { expirationTtl: 60 * 60 * 24 * 7 });
    },
  };
}

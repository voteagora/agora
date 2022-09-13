import { createServer } from "@graphql-yoga/common";
import { makeGatewaySchema } from "./schema";
import {
  getAssetFromKV,
  serveSinglePageApp,
} from "@cloudflare/kv-asset-handler";
import manifestJSON from "__STATIC_CONTENT_MANIFEST";
import { z } from "zod";
import {
  AgoraContextType,
  EmailStorage,
  StatementStorage,
  StoredStatement,
} from "./model";
import { makeNounsExecutor } from "./schemas/nouns-subgraph";
import { ValidatedMessage } from "./utils/signing";
import Toucan from "toucan-js";
import { ExpiringCache } from "./utils/cache";
const assetManifest = JSON.parse(manifestJSON);

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/worker.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/worker.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  ENVIRONMENT: "prod" | "dev" | "staging";
  SENTRY_DSN: string;
  GITHUB_SHA: string;

  STATEMENTS: KVNamespace;
  APPLICATION_CACHE: KVNamespace;
  EMAILS: KVNamespace;
  __STATIC_CONTENT: KVNamespace;
}

const storedStatementSchema = z.object({
  updatedAt: z.number(),
  address: z.string(),
  signature: z.string(),
  signedPayload: z.string(),
});

function makeStatementStorage(kvNamespace: KVNamespace): StatementStorage {
  return {
    async addStatement(statement: StoredStatement): Promise<void> {
      await kvNamespace.put(
        statement.address.toLowerCase(),
        JSON.stringify(statement)
      );
    },

    async getStatement(address: string): Promise<StoredStatement | null> {
      const serializedValue = await kvNamespace.get(address.toLowerCase());
      if (!serializedValue) {
        return null;
      }

      const parsedStatement = JSON.parse(serializedValue);

      return storedStatementSchema.parse(parsedStatement) as any;
    },

    async listStatements(): Promise<string[]> {
      const entries = await kvNamespace.list();
      return entries.keys.map((item) => item.name.toLowerCase());
    },
  };
}

function makeEmailStorage(kvNamespace: KVNamespace): EmailStorage {
  return {
    async addEmail(verifiedEmail: ValidatedMessage): Promise<void> {
      await kvNamespace.put(
        verifiedEmail.address,
        JSON.stringify({
          signature: verifiedEmail.signature,
          value: verifiedEmail.value,
        })
      );
    },
  };
}

function makeCacheFromKvNamespace(kvNamespace: KVNamespace): ExpiringCache {
  return {
    async get(key: string): Promise<string | null> {
      return await kvNamespace.get(key);
    },
    async put(key: string, value: string, ttl: number): Promise<void> {
      await kvNamespace.put(
        key,
        value,
        ttl === Infinity ? undefined : { expirationTtl: ttl }
      );
    },
  };
}

// Initializing the schema takes about 250ms. We should avoid doing it once
// per request. We need to move this calculation into some kind of compile time
// step.
let gatewaySchema = null;

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const sentry = new Toucan({
      dsn: env.SENTRY_DSN,
      environment: env.ENVIRONMENT,
      release: env.GITHUB_SHA,
      context: ctx,
      request,
      rewriteFrames: {
        root: "/",
      },
    });

    try {
      const isProduction = env.ENVIRONMENT === "prod";
      const url = new URL(request.url);
      if (url.pathname === "/graphql") {
        if (!gatewaySchema) {
          gatewaySchema = makeGatewaySchema();
        }

        const context: AgoraContextType = {
          statementStorage: makeStatementStorage(env.STATEMENTS),
          emailStorage: makeEmailStorage(env.EMAILS),
          nounsExecutor: makeNounsExecutor(),
          cache: makeCacheFromKvNamespace(env.APPLICATION_CACHE),
        };

        const server = createServer({
          schema: gatewaySchema,
          context,
          maskedErrors: isProduction,
          graphiql: !isProduction,
        });

        return server.handleRequest(request, { env, ctx });
      } else {
        return await getAssetFromKV(
          {
            request,
            waitUntil(promise) {
              return ctx.waitUntil(promise);
            },
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: assetManifest,
            mapRequestToAsset: serveSinglePageApp,
          }
        );
      }
    } catch (e) {
      sentry.captureException(e);
      throw e;
    }
  },
};

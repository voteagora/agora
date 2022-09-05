import { createServer } from "@graphql-yoga/common";
import { makeGatewaySchema } from "./schema";
import { createInMemoryCache } from "@envelop/response-cache";
import { makeCachePlugin } from "./cache";

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
}

let makeGatewaySchemaPromise = null;

const cache = createInMemoryCache();

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (!makeGatewaySchemaPromise) {
      makeGatewaySchemaPromise = makeGatewaySchema();
    }
    const schema = await makeGatewaySchemaPromise;
    const server = createServer({
      schema,
      // todo: fix for prod
      maskedErrors: false,
      plugins: [makeCachePlugin(cache)],
    });

    return server.handleRequest(request, { env, ctx });
  },
};

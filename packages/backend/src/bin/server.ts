import "isomorphic-fetch";
import { createServer } from "@graphql-yoga/node";
import { makeGatewaySchema } from "../schema";
import { useTiming } from "@envelop/core";
import { createInMemoryCache, useResponseCache } from "@envelop/response-cache";
import { makeCachePlugin } from "../cache";

async function main() {
  const schema = await makeGatewaySchema();

  const cache = createInMemoryCache();

  const server = createServer({
    schema,
    port: 4001,
    maskedErrors: false,
    plugins: [useTiming(), makeCachePlugin(cache)],
  });
  await server.start();
}

main();

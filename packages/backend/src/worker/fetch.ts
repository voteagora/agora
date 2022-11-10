import { createServer } from "@graphql-yoga/common";
import Toucan from "toucan-js";
import { Env } from "./env";
import { useSentry } from "./useSentry";
import { getGraphQLCallingContext } from "./graphql";
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

import manifestJSON from "__STATIC_CONTENT_MANIFEST";
const assetManifest = JSON.parse(manifestJSON);

export async function fetch(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  sentry: Toucan
) {
  const isProduction = env.ENVIRONMENT === "prod";
  const url = new URL(request.url);
  if (url.pathname === "/graphql") {
    const { schema, context } = await getGraphQLCallingContext(
      request,
      env,
      ctx
    );

    const server = createServer({
      schema,
      context,
      maskedErrors: isProduction,
      graphiql: !isProduction,
      plugins: [useSentry(sentry)],
    });

    return server.handleRequest(request, { env, ctx });
  }

  if (isStaticFile(request)) {
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
      }
    );
  }

  const content = await env.__STATIC_CONTENT.get(assetManifest["index.html"]);

  return new Response(content, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
    },
  });
}

export function isStaticFile(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/+/, "");
  return assetManifest[path];
}

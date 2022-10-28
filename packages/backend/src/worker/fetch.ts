import { createServer } from "@graphql-yoga/common";
import Toucan from "toucan-js";
import { Env } from "./env";
import { useSentry } from "./useSentry";
import { getGraphQLCallingContext } from "./graphql";
import opengraphQuery from "../../../render-opengraph/src/OpenGraphRenderQuery.graphql";
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

import { execute, parse } from "graphql";
import { getDrawDependencies } from "./draw";

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

  const openGraphImageUrlMatch = url.pathname.match(
    /^\/images\/opengraph\/(.+)\/image\.png$/
  );
  if (openGraphImageUrlMatch) {
    const address = decodeURIComponent(openGraphImageUrlMatch[1]);
    const key = `opengraph-2-${address}`;
    const fromCache = await env.APPLICATION_CACHE.get(key, "stream");
    if (fromCache) {
      return new Response(fromCache);
    }

    const { schema, context } = await getGraphQLCallingContext(
      request,
      env,
      ctx
    );

    const document = parse(opengraphQuery);

    const result = await execute({
      schema,
      document,
      variableValues: {
        address,
      },
      contextValue: context,
    });

    const draw = await getDrawDependencies(env.__STATIC_CONTENT, assetManifest);
    const response = draw.draw_image(JSON.stringify(result.data));
    if (!response) {
      return new Response("not found", { status: 404 });
    }

    ctx.waitUntil(
      env.APPLICATION_CACHE.put(key, response, {
        expirationTtl: 60 * 60 * 24 * 7,
      })
    );
    return new Response(response);
  }

  const content = await env.__STATIC_CONTENT.get(assetManifest["index.html"]);

  const imageReplacementValue = (() => {
    const pathMatch = url.pathname.match(/^\/delegate\/(.+)$/);
    if (pathMatch) {
      const delegateName = pathMatch[1];
      return `/images/opengraph/${delegateName}/image.png`;
    }

    return "/og.jpeg";
  })();

  return new Response(
    content.replaceAll("$$OG_IMAGE_SENTINEL$$", imageReplacementValue),
    {
      headers: {
        "content-type": "text/html; charset=UTF-8",
      },
    }
  );
}

export function isStaticFile(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/+/, "");
  return assetManifest[path];
}

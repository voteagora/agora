import { Env, shouldUseCache } from "./env";
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import { fetchThroughCache } from "./cache";
import { simulateTransaction } from "./tenderly";
import { fetchMessage } from "./genosis";

import manifestJSON from "__STATIC_CONTENT_MANIFEST";
import { handleAuthRequest } from "./rpgfApi/auth";
import PrismaSingleton from "../store/prisma/client";
import { handleBallotsRequest } from "./rpgfApi/ballots";
import { handleLikesRequest } from "./rpgfApi/likes";
import { createResponse, handleOptionsRequest } from "./rpgfApi/utils";

const assetManifest = JSON.parse(manifestJSON);

export async function fetch(request: Request, env: Env, ctx: ExecutionContext) {
  PrismaSingleton.setConnectionUrl(env.DATABASE_URL!);

  const url = new URL(request.url);
  const name =
    request.headers.get("x-durable-object-instance-name") ||
    env.PRIMARY_DURABLE_OBJECT_INSTANCE_NAME;

  if (url.pathname === "/simulate") {
    const body = await request.json();
    const result = await simulateTransaction({
      body,
      user: env.TENDERLY_USER,
      project: env.TENDERLY_PROJECT,
      accessKey: env.TENDERLY_ACCESS_KEY,
    });

    return createResponse(result, 200);
  }

  if (url.pathname === "/fetch_signature") {
    const { safeMessageHash } = (await request.json()) as any;
    if (safeMessageHash) {
      const result = await fetchMessage({
        safeMessageHash: safeMessageHash,
      });

      if (result.error) {
        return createResponse(result.error, 500);
      }

      return createResponse(result.response as any, 200);
    }

    return createResponse("Invalid request", 400);
  }

  // ----------------
  // RPGF API
  // ----------------

  if (url.pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      return handleOptionsRequest(request);
    }

    const path = url.pathname.split("/").slice(1);

    switch (path[1]) {
      case "auth":
        return await handleAuthRequest(path[2], request, env);

      case "ballot":
        return await handleBallotsRequest(request, env);

      case "likes":
        return await handleLikesRequest(request, env);

      default:
        return createResponse(
          { error: `Invalid path: ${url.pathname}` },
          400,
          {},
          request
        );
    }
  }

  if (
    url.pathname === "/graphql" ||
    url.pathname === "/inspect" ||
    url.pathname.startsWith("/admin/")
  ) {
    const object = env.STORAGE_OBJECT.get(env.STORAGE_OBJECT.idFromName(name));

    if (url.pathname !== "/graphql") {
      return await object.fetch(request);
    }

    if (shouldUseCache(env)) {
      const graphqlCache = await caches.open("graphql");
      return await fetchThroughCache(
        graphqlCache,
        request.clone(),
        () => object.fetch(request),
        ctx
      );
    } else {
      return await object.fetch(request);
    }
  }

  if (isStaticFile(request)) {
    return (await getAssetFromKV(
      {
        request: request as any,
        waitUntil(promise) {
          return ctx.waitUntil(promise);
        },
      },
      {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
      }
    )) as any as Response;
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

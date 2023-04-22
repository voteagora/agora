import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import manifestJSON from "__STATIC_CONTENT_MANIFEST";

import { fetchThroughCache } from "./cache";
import { Env, shouldUseCache } from "./env";

const assetManifest = JSON.parse(manifestJSON);

export async function fetch(request: Request, env: Env, ctx: ExecutionContext) {
  const url = new URL(request.url);
  const name =
    request.headers.get("x-durable-object-instance-name") ||
    env.PRIMARY_DURABLE_OBJECT_INSTANCE_NAME;

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

import manifestJSON from "__STATIC_CONTENT_MANIFEST";
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

import { RouteDefinition } from "./route";

const assetManifest = JSON.parse(manifestJSON);

export function staticFileRouteDefinitions(): RouteDefinition<{
  __STATIC_CONTENT: KVNamespace;
}>[] {
  return [
    {
      matcher(request, url) {
        const path = url.pathname.replace(/^\/+/, "");
        return !!assetManifest[path];
      },
      async handle(request, env, ctx) {
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
      },
    },
    {
      matcher() {
        return true;
      },
      async handle(request, env) {
        const content = await env.__STATIC_CONTENT.get(
          assetManifest["index.html"]
        );

        return new Response(content, {
          headers: {
            "content-type": "text/html; charset=UTF-8",
          },
        });
      },
    },
  ];
}

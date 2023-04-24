import { fetchThroughCache } from "../cache";

import { Handler } from "./route";

export function withCache<Env>(
  handler: Handler<Env>,
  shouldCache: (env: Env) => boolean,
  cacheName: string,
  seconds: number
): Handler<Env> {
  return async (request, env, ctx) => {
    if (shouldCache(env)) {
      return await handler(request, env, ctx);
    }

    const graphqlCache = await caches.open(cacheName);

    return await fetchThroughCache(
      graphqlCache,
      request.clone(),
      async () => await handler(request, env, ctx),
      ctx,
      seconds
    );
  };
}

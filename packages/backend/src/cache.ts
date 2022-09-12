import { Cache, useResponseCache } from "@envelop/response-cache";

export function makeCachePlugin(cache: Cache) {
  return useResponseCache({
    cache,
    session: () => null,
    ttl: 10_000,
    ttlPerSchemaCoordinate: {
      "Query.metrics": 60_000 * 60,
      "ResolvedName.name": 60_000 * 60,
      "Vote.createdAt": Infinity,
    },
  });
}

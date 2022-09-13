export type ExpiringCache = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, ttl: number): Promise<void>;
};

export type CacheRetrievalDefinition<Value, Params> = {
  baseKey: string;
  generateKeyFromParams(params: Params): string;
  computeIfAbsent(params: Params): Promise<ComputeIfAbsentResult<Value>>;
};

export type ComputeIfAbsentResult<Value> = {
  /**
   * Number of milliseconds this value should be cached for.
   */
  ttl: number;

  value: Value;
};

export async function fetchWithCache<Value, Params>(
  cache: ExpiringCache,
  definition: CacheRetrievalDefinition<Value, Params>,
  params: Params
): Promise<Value> {
  const computedKey = `${definition.baseKey}|${definition.generateKeyFromParams(
    params
  )}`;
  const fromCache = await cache.get(computedKey);
  if (fromCache) {
    return JSON.parse(fromCache) as any;
  }

  const cacheResult = await definition.computeIfAbsent(params);
  await cache.put(
    computedKey,
    JSON.stringify(cacheResult.value),
    cacheResult.ttl
  );

  return cacheResult.value;
}

export function makeDefinitionWithFixedTtl<Value, Params>({
  baseKey,
  generateKeyFromParams,
  computeIfAbsent,
  ttl,
}: {
  baseKey: string;
  generateKeyFromParams(params: Params): string;
  computeIfAbsent(params: Params): Promise<Value>;
  ttl: number;
}): CacheRetrievalDefinition<Value, Params> {
  return {
    baseKey,
    generateKeyFromParams,
    async computeIfAbsent(
      params: Params
    ): Promise<ComputeIfAbsentResult<Value>> {
      return {
        ttl,
        value: await computeIfAbsent(params),
      };
    },
  };
}

export function makeSimpleCacheDefinition<Value>({
  baseKey,
  computeIfAbsent,
  ttl,
}: {
  baseKey: string;
  computeIfAbsent(): Promise<Value>;
  ttl: number;
}) {
  return makeDefinitionWithFixedTtl<Value, undefined>({
    baseKey,
    ttl,
    generateKeyFromParams(): string {
      return "";
    },
    async computeIfAbsent() {
      return await computeIfAbsent();
    },
  });
}

export function makeInMemoryCache(): ExpiringCache {
  const storage = new Map<string, { value: string; expiresAt: number }>();

  return {
    async put(key: string, value: string, ttl: number): Promise<void> {
      storage.set(key, { value, expiresAt: Date.now() + 1000 * ttl });
    },
    async get(key: string): Promise<string | null> {
      const fromMap = storage.get(key);
      if (!fromMap) {
        return null;
      }

      if (Date.now() > fromMap.expiresAt) {
        storage.delete(key);
        return null;
      }

      return fromMap.value;
    },
  };
}

export type ExpiringCache = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
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

type WaitUntil = (promise: Promise<any>) => void;

export type CacheDependencies = {
  cache: ExpiringCache;
  waitUntil: WaitUntil;
};

export async function fetchWithCache<Value, Params>(
  { cache, waitUntil }: CacheDependencies,
  definition: CacheRetrievalDefinition<Value, Params>,
  params: Params
): Promise<Value> {
  type CacheValue = {
    value: any;
    expiresAt: number;
  };

  async function computeAndStoreCacheValue(): Promise<Value> {
    const cacheResult = await definition.computeIfAbsent(params);
    const value: CacheValue = {
      value: cacheResult.value,
      expiresAt: cacheResult.ttl * 1000 + Date.now(),
    };

    await cache.put(computedKey, JSON.stringify(value));

    return value.value;
  }

  const computedKey = `${definition.baseKey}|${definition.generateKeyFromParams(
    params
  )}`;
  const fromCache = await cache.get(computedKey);
  if (!fromCache) {
    return await computeAndStoreCacheValue();
  }

  const cacheValue = JSON.parse(fromCache) as CacheValue;
  if (Date.now() > cacheValue.expiresAt) {
    waitUntil(computeAndStoreCacheValue());
  }

  return cacheValue.value;
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
  const storage = new Map<string, string>();

  return {
    async put(key: string, value: string): Promise<void> {
      storage.set(key, value);
    },
    async get(key: string): Promise<string | null> {
      const fromMap = storage.get(key);
      if (!fromMap) {
        return null;
      }

      return fromMap;
    },
  };
}

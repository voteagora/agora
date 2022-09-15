import { makeNopSpanMap, TracingContext } from "../model";

export type Span = {
  startChildSpan(name: string): Span;
  addData(data: any);
  finish(): void;
};

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
  span: Span;
  waitUntil: WaitUntil;
};

async function withChildSpan<T>(
  span: Span,
  name: string,
  data: any,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const childSpan = span.startChildSpan(name);
  childSpan.addData(data);
  const result = await fn(span);
  childSpan.finish();
  return result;
}

export async function fetchWithCache<Value, Params>(
  { cache, waitUntil, span }: CacheDependencies,
  definition: CacheRetrievalDefinition<Value, Params>,
  params: Params
): Promise<Value> {
  const computedKey = `${definition.baseKey}|${definition.generateKeyFromParams(
    params
  )}`;

  type CacheValue = {
    value: any;
    expiresAt: number;
  };

  const spanFields = {
    computedKey,
    baseKey: definition.baseKey,
  };

  async function computeAndStoreCacheValue(): Promise<Value> {
    const cacheResult = await withChildSpan(
      span,
      "cache.computeIfAbsent",
      { cache: spanFields },
      async () => definition.computeIfAbsent(params)
    );
    const value: CacheValue = {
      value: cacheResult.value,
      expiresAt: cacheResult.ttl * 1000 + Date.now(),
    };

    await withChildSpan(
      span,
      "cache.put",
      {
        cache: {
          ...spanFields,
          ttl: cacheResult.ttl,
        },
      },
      async () => await cache.put(computedKey, JSON.stringify(value))
    );

    return value.value;
  }

  const fromCache = await withChildSpan(
    span,
    "cache.get",
    { cache: spanFields },
    () => cache.get(computedKey)
  );
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

export function makeNoOpCache(): ExpiringCache {
  return {
    get(key: string): Promise<string | null> {
      return null;
    },

    put(key: string, value: string): Promise<void> {
      return;
    },
  };
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

export function makeFakeSpan() {
  const fakeSpan = {
    startChildSpan() {
      return fakeSpan;
    },

    finish() {},
    addData() {},
  };

  return fakeSpan;
}

export function makeEmptyTracingContext(): TracingContext {
  return {
    rootSpan: makeFakeSpan(),
    spanMap: makeNopSpanMap(),
  };
}

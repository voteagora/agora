export function getOrInsert<K, V>(
  map: Map<K, V>,
  key: K,
  factory: (k: K) => V
): V {
  const fromMap = map.get(key);
  if (fromMap) {
    return fromMap;
  }

  const created = factory(key);
  map.set(key, created);
  return created;
}

export function concatMaps<K, V>(
  map: Map<K, V>,
  ...iterables: Iterable<[K, V]>[]
) {
  for (const iterable of iterables) {
    for (const item of iterable) {
      map.set(...item);
    }
  }
}

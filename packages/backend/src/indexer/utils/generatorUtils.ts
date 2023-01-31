export async function* indexed<T>(
  asyncGenerator: AsyncGenerator<T>
): AsyncGenerator<[number, T]> {
  let i = 0;
  for await (const item of asyncGenerator) {
    yield [i, item];
    i++;
  }
}

export async function* batch<T>(
  iterator: AsyncIterable<T>,
  batchSize: number
): AsyncGenerator<T[]> {
  let batch = [];

  for await (const item of iterator) {
    batch.push(item);

    if (batch.length === batchSize) {
      yield batch;
      batch = [];
    }
  }

  if (batch.length) {
    yield batch;
  }
}

export async function* groupBy<T>(
  generator: AsyncGenerator<T>,
  keyOf: (item: T) => string
): AsyncGenerator<T[]> {
  let lastGroupKey: string | null = null;
  let group = [];

  for await (const item of generator) {
    const groupKey = keyOf(item);

    if (lastGroupKey && groupKey !== lastGroupKey) {
      yield group;
      group = [];
    }

    group.push(item);
    lastGroupKey = groupKey;
  }

  if (group.length) {
    yield group;
  }
}

export async function* limitGenerator<T>(
  asyncGenerator: AsyncIterable<T>,
  limit: number
): AsyncGenerator<T> {
  let i = 0;
  for await (const item of asyncGenerator) {
    if (i >= limit) {
      return;
    }

    yield item;
    i++;
  }
}

export async function collectGenerator<T>(
  asyncGenerator: AsyncGenerator<T>
): Promise<T[]> {
  const items = [];
  for await (const item of asyncGenerator) {
    items.push(item);
  }

  return items;
}

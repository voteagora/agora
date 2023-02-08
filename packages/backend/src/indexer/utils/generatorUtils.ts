export async function* indexed<T>(
  asyncGenerator: AsyncIterable<T>
): AsyncGenerator<[number, T]> {
  let i = 0;
  for await (const item of asyncGenerator) {
    yield [i, item];
    i++;
  }
}

export function* infiniteStream<T>(item: T): Iterator<T> {
  while (true) {
    yield item;
  }
}

export async function* skipFirst<T>(
  iterator: AsyncIterable<T>,
  n: number
): AsyncGenerator<T> {
  for await (const [idx, item] of indexed(iterator)) {
    if (idx < n) {
      continue;
    }

    yield item;
  }
}

export async function* asyncIterableFromIterable<T>(
  iterator: Iterable<T>
): AsyncGenerator<T> {
  for (const item of iterator) {
    yield item;
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

export async function* filterGenerator<T>(
  asyncIterable: AsyncIterable<T>,
  checkFn: (item: T) => boolean
): AsyncGenerator<T> {
  for await (const item of asyncIterable) {
    if (checkFn(item)) {
      yield item;
    }
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

export async function takeLast<T>(gen: AsyncIterable<T>): Promise<T | null> {
  let lastValue = null;
  for await (const item of gen) {
    lastValue = item;
  }

  return lastValue;
}

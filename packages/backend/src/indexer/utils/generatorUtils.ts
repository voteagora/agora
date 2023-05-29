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

export function* countingStream(
  endingIndexExclusive: number,
  startingIndex: number = 0,
  step: number = 1
) {
  for (let idx = startingIndex; idx < endingIndexExclusive; idx += step) {
    yield idx;
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
  iterable: Iterable<T>
): AsyncGenerator<T> {
  for (const item of iterable) {
    yield item;
  }
}

export function makeIterableFromIterator<T>(
  iterator: Iterator<T>
): Iterable<T> {
  return {
    [Symbol.iterator]: () => iterator,
  };
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
  checkFn: (item: T) => Promise<boolean> | boolean
): AsyncGenerator<T> {
  for await (const item of asyncIterable) {
    const shouldInclude = await checkFn(item);
    if (shouldInclude) {
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

export async function* skipGenerator<T>(
  asyncGenerator: AsyncIterable<T>,
  n: number
): AsyncGenerator<T> {
  for await (const [idx, item] of indexed(asyncGenerator)) {
    if (idx < n) {
      continue;
    }

    yield item;
  }
}

export function* infiniteCountingGenerator() {
  let idx = 0;
  while (true) {
    yield idx;
    idx++;
  }
}

export async function takeLast<T>(gen: AsyncIterable<T>): Promise<T | null> {
  let lastValue = null;
  for await (const item of gen) {
    lastValue = item;
  }

  return lastValue;
}

export async function* flatten<T>(gen: AsyncGenerator<T[]>): AsyncGenerator<T> {
  for await (const items of gen) {
    for (const item of items) {
      yield item;
    }
  }
}

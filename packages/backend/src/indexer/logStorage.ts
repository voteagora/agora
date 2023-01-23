import { IndexerDefinition } from "./process";
import { createReadStream, promises as fs } from "fs";
import * as readline from "readline";
import { ethers } from "ethers";
import { BlockIdentifier } from "./storageHandle";
import { Comparator, compareByTuple } from "./utils/sortUtils";
import Heap from "heap";

export async function loadLastLogIndex(
  reducer: IndexerDefinition
): Promise<BlockIdentifier | null> {
  const contents = await fs
    .readFile(pathForLogsIndex(reducer), { encoding: "utf-8" })
    .catch((e) => null);
  if (!contents) {
    return null;
  }

  return JSON.parse(contents);
}

export async function loadLastLog(
  reducer: IndexerDefinition
): Promise<ethers.providers.Log | null> {
  const last = await takeLast(loadReducerLogsRaw(reducer));
  if (!last) {
    return null;
  }

  return JSON.parse(last);
}

async function takeLast<T>(gen: AsyncIterable<T>): Promise<T | null> {
  let lastValue = null;
  for await (const item of gen) {
    lastValue = item;
  }

  return lastValue;
}

export function pathForLogs(reducer: IndexerDefinition) {
  return `data/logs/${reducer.name}.json`;
}

export function pathForLogsIndex(reducer: IndexerDefinition) {
  return `data/logs/${reducer.name}.index.json`;
}

async function* loadReducerLogsRaw(
  reducer: IndexerDefinition
): AsyncGenerator<string> {
  const file = createReadStream(pathForLogs(reducer));
  const generator = readline.createInterface({
    input: file,
    crlfDelay: Infinity,
  });

  try {
    for await (const line of generator) {
      yield line;
    }
  } catch (e) {
    if ((e as any).code === "ENOENT") {
      return null;
    }

    throw e;
  }
}

export async function* loadReducerLogs(reducer: IndexerDefinition) {
  for await (const line of loadReducerLogsRaw(reducer)) {
    yield JSON.parse(line) as ethers.providers.Log;
  }
}

export function loadMergedLogs(
  indexers: IndexerDefinition[]
): AsyncGenerator<ethers.providers.Log> {
  return mergeGenerators(
    compareByTuple((it) => [it.blockNumber, it.transactionIndex, it.logIndex]),
    ...indexers.map((indexer) => loadReducerLogs(indexer))
  );
}

export async function* mergeGenerators<T>(
  comparator: Comparator<T>,
  ...generators: AsyncGenerator<T>[]
): AsyncGenerator<T> {
  const heap = new Heap<{ generator: AsyncGenerator<T>; nextItem: T }>(
    ({ nextItem: lhs }, { nextItem: rhs }) => {
      return comparator(lhs, rhs);
    }
  );

  const initialItems = await Promise.all(
    generators.map(async (generator) => ({
      generator,
      nextItem: await generator.next(),
    }))
  );
  for (const item of initialItems) {
    if (!item.nextItem.done) {
      heap.push({ generator: item.generator, nextItem: item.nextItem.value });
    }
  }

  while (true) {
    const item = heap.pop();
    if (!item) {
      break;
    }

    const { nextItem, generator } = item;

    yield nextItem;

    const nextResult = await generator.next();
    if (!nextResult.done) {
      heap.push({
        generator,
        nextItem: nextResult.value,
      });
    }
  }
}

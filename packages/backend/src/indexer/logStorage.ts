import { IndexerDefinition } from "./process";
import { createReadStream } from "fs";
import * as readline from "readline";
import { ethers } from "ethers";
import { promises as fs } from "fs";
import { BlockIdentifier } from "./storageHandle";

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
  try {
    for await (const item of gen) {
      lastValue = item;
    }
  } catch (e) {
    if (e.code === "ENOENT") {
      return lastValue;
    }

    throw e;
  }

  return lastValue;
}

export function pathForLogs(reducer: IndexerDefinition) {
  return `data/logs/${reducer.name}.json`;
}

export function pathForLogsIndex(reducer: IndexerDefinition) {
  return `data/logs/${reducer.name}.index.json`;
}

function loadReducerLogsRaw(reducer: IndexerDefinition) {
  const file = createReadStream(pathForLogs(reducer));
  return readline.createInterface({
    input: file,
    crlfDelay: Infinity,
  });
}

export async function* loadReducerLogs(reducer: IndexerDefinition) {
  for await (const line of loadReducerLogsRaw(reducer)) {
    yield JSON.parse(line) as ethers.providers.Log;
  }
}

import { createReadStream, promises as fs } from "fs";
import * as readline from "readline";
import path from "path";

import { ethers } from "ethers";

import { compareByTuple } from "../utils/sortUtils";
import { mergeGenerators, takeLast } from "../utils/generatorUtils";

import { BlockIdentifier } from "./process/storageHandle";
import { IndexerDefinition } from "./process/indexerDefinition";

export async function loadLastLogIndex(
  reducer: IndexerDefinition,
  basePath: string
): Promise<BlockIdentifier | null> {
  const contents = await fs
    .readFile(pathForLogsIndex(reducer, basePath), { encoding: "utf-8" })
    .catch((e) => null);
  if (!contents) {
    return null;
  }

  return JSON.parse(contents);
}

export async function loadLastLog(
  reducer: IndexerDefinition,
  basePath: string
): Promise<ethers.providers.Log | null> {
  const last = await takeLast(loadReducerLogsRaw(reducer, basePath));
  if (!last) {
    return null;
  }

  return JSON.parse(last);
}

export function logsDirectory(basePath: string) {
  return path.join(basePath, `logs`);
}

export function pathForLogs(reducer: IndexerDefinition, basePath: string) {
  return path.join(logsDirectory(basePath), `${reducer.name}.json`);
}

export function pathForLogsIndex(reducer: IndexerDefinition, basePath: string) {
  return path.join(logsDirectory(basePath), `${reducer.name}.index.json`);
}

export async function writeLogIndex(
  reducer: IndexerDefinition,
  content: BlockIdentifier,
  basePath: string
) {
  return await fs.writeFile(
    pathForLogsIndex(reducer, basePath),
    JSON.stringify(content)
  );
}

async function* loadReducerLogsRaw(
  reducer: IndexerDefinition,
  basePath: string
): AsyncGenerator<string> {
  const file = createReadStream(pathForLogs(reducer, basePath));
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

export async function* loadReducerLogs(
  reducer: IndexerDefinition,
  basePath: string
) {
  for await (const line of loadReducerLogsRaw(reducer, basePath)) {
    yield JSON.parse(line) as ethers.providers.Log;
  }
}

export function loadMergedLogs(
  indexers: IndexerDefinition[],
  basePath: string
): AsyncGenerator<ethers.providers.Log> {
  return mergeGenerators(
    indexers.map((indexer) => loadReducerLogs(indexer, basePath)),
    compareByTuple((it) => [it.blockNumber, it.transactionIndex, it.logIndex])
  );
}

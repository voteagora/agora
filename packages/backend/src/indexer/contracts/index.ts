import { nounsTokenIndexer } from "./NounsToken";
import { governorIndexer } from "./NounsDAO";
import { IndexerDefinition } from "../process";

export const indexers: IndexerDefinition[] = [
  // @ts-ignore
  nounsTokenIndexer,
  // @ts-ignore
  governorIndexer,
];

export function getIndexerByName(indexers: IndexerDefinition[], name: string) {
  const indexer = indexers.find((it) => it.name === name);
  if (!indexer) {
    throw new Error(
      `${indexer} not found, possible options ${indexers
        .map((indexer) => indexer.name)
        .join(", ")}`
    );
  }

  return indexer;
}

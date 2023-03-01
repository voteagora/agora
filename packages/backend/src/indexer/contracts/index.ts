import { nounsTokenIndexer } from "./NounsToken";
import { governorIndexer } from "./NounsDAO";
import { IndexerDefinition } from "../process";

export const indexers: IndexerDefinition[] = [
  // @ts-ignore
  nounsTokenIndexer,
  // @ts-ignore
  governorIndexer,
];

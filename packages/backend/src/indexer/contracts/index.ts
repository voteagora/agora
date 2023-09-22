import { governanceTokenIndexer } from "./GovernanceToken";
import { governorIndexer } from "./OptimismGovernor";
import { IndexerDefinition } from "../process";
import { governorIndexerTest } from "./OptimismGovernorTest";
import { EASIndexer } from "./EAS";

export const indexers: IndexerDefinition[] = [
  // @ts-ignore
  governanceTokenIndexer,
  // @ts-ignore
  governorIndexer,
  // @ts-ignore
  governorIndexerTest,
  // @ts-ignore
  EASIndexer,
];

export const entityDefinitions = {
  ...governanceTokenIndexer.entities,
  ...governorIndexer.entities,
  ...EASIndexer.entities,
};

import { governanceTokenIndexer } from "./GovernanceToken";
import { governorIndexer } from "./OptimismGovernor";
import { IndexerDefinition } from "../process";
import { governorIndexerTest } from "./OptimismGovernorTest";

export const indexers: IndexerDefinition[] = [
  // @ts-ignore
  governanceTokenIndexer,
  // @ts-ignore
  governorIndexer,
  // @ts-ignore
  governorIndexerTest,
];

export const entityDefinitions = {
  ...governanceTokenIndexer.entities,
  ...governorIndexer.entities,
};

import { governanceTokenIndexer } from "./GovernanceToken";
import { governorIndexer } from "./OptimismGovernorV1";
import { IndexerDefinition } from "../process";

export const indexers: IndexerDefinition[] = [
  // @ts-ignore
  governanceTokenIndexer,
  // @ts-ignore
  governorIndexer,
];

export const entityDefinitions = {
  ...governanceTokenIndexer.entities,
  ...governorIndexer.entities,
};

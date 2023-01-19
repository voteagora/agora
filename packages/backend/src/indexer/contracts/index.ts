import { governanceTokenIndexer } from "./GovernanceToken";
import { governorIndexer } from "./OptimismGovernorV1";
import { IndexerDefinition } from "../process";

export const indexers: IndexerDefinition[] = [
  governanceTokenIndexer,
  governorIndexer,
];

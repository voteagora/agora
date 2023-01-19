import { governanceTokenIndexer } from "./GovernanceToken";
import { governorIndexer } from "./OptimismGovernorV1";
import { IndexerDefinition } from "../process";

export const indexers: IndexerDefinition[] = [
  // @ts-expect-error
  governanceTokenIndexer,
  // @ts-expect-error
  governorIndexer,
];

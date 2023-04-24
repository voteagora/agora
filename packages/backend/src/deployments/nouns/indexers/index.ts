import {
  mergeEntityDefinitions,
  widenIndexerDefinition,
} from "../../../shared/indexer/process/indexerDefinition";

import { nounsTokenIndexer } from "./NounsToken/NounsToken";
import { governorIndexer } from "./NounsDAO/NounsDAO";
import { alligatorIndexer } from "./Alligator";

export const indexers = [
  widenIndexerDefinition(nounsTokenIndexer),
  widenIndexerDefinition(governorIndexer),
  widenIndexerDefinition(alligatorIndexer),
];

export const entityDefinitions = mergeEntityDefinitions([
  nounsTokenIndexer.entityDefinitions,
  governorIndexer.entityDefinitions,
  alligatorIndexer.entityDefinitions,
]);

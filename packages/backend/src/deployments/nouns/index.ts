import { makeDeploymentArgs } from "../../shared/indexer/deployments";
import {
  mergeEntityDefinitions,
  widenIndexerDefinition,
} from "../../shared/indexer/process/indexerDefinition";

import { modules } from "./application";
import { nounsTokenIndexer } from "./indexers/NounsToken/NounsToken";
import { governorIndexer } from "./indexers/NounsDAO/NounsDAO";
import { alligatorIndexer } from "./indexers/Alligator";

const indexers = [
  widenIndexerDefinition(nounsTokenIndexer),
  widenIndexerDefinition(governorIndexer),
  widenIndexerDefinition(alligatorIndexer),
];

const entityDefinitions = mergeEntityDefinitions([
  nounsTokenIndexer.entityDefinitions,
  governorIndexer.entityDefinitions,
  alligatorIndexer.entityDefinitions,
]);

export const nounsDeployment = makeDeploymentArgs({
  modules,
  indexers,
  entityDefinitions,
});

export { makeContext } from "./application";

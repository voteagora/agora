import { makeDeploymentArgs } from "../../shared/indexer/deployments";
import {
  mergeEntityDefinitions,
  widenIndexerDefinition,
} from "../../shared/indexer/process/indexerDefinition";
import { Env } from "../../shared/types";

import { modules } from "./application";
import {
  nounsTokenIndexer,
  nounsTokenIndexerSepolia,
} from "./indexers/NounsToken/NounsToken";
import {
  governorIndexer,
  governorIndexerSepolia,
} from "./indexers/NounsDAO/NounsDAO";
import {
  alligatorIndexer,
  alligatorIndexerSepolia,
} from "./indexers/Alligator";

const indexers = (env: Env) => {
  switch (env) {
    case "prod":
      return [
        widenIndexerDefinition(nounsTokenIndexer),
        widenIndexerDefinition(governorIndexer),
        widenIndexerDefinition(alligatorIndexer),
      ];
    default:
      return [
        widenIndexerDefinition(nounsTokenIndexerSepolia),
        widenIndexerDefinition(governorIndexerSepolia),
        widenIndexerDefinition(alligatorIndexerSepolia),
      ];
  }
};

const entityDefinitions = mergeEntityDefinitions([
  nounsTokenIndexer.entityDefinitions,
  governorIndexer.entityDefinitions,
  alligatorIndexer.entityDefinitions,
  nounsTokenIndexerSepolia.entityDefinitions,
  governorIndexerSepolia.entityDefinitions,
  alligatorIndexerSepolia.entityDefinitions,
]);

export const nounsDeployment = (env: Env) =>
  makeDeploymentArgs({
    modules,
    indexers: indexers(env),
    entityDefinitions,
  });

export { makeContext } from "./application";

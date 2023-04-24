import { makeDeploymentArgs } from "../../shared/indexer/deployments";

import { entityDefinitions, indexers } from "./indexers";
import { modules } from "./application";

export const nounsDeployment = makeDeploymentArgs({
  modules,
  indexers,
  entityDefinitions,
});

export { makeContext } from "./application";

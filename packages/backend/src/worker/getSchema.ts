// Initializing the schema takes about 250ms. We should avoid doing it once
// per request. We need to move this calculation into some kind of compile time
// step.
import type { GraphQLSchema } from "graphql";

import { applyIdPrefix } from "../shared/schema/transformers/applyIdPrefix";
import { combineModules } from "../shared/schema/modules";
import { nounsDeployment } from "../deployments/nouns";
import { Env } from "../shared/types";

let gatewaySchema: GraphQLSchema | null = null;

export function getSchema(env: Env) {
  if (!gatewaySchema) {
    gatewaySchema = applyIdPrefix(combineModules(nounsDeployment(env).modules));
  }

  return gatewaySchema;
}

import { printSchema } from "graphql";

import { nounsDeployment } from "../../deployments/nouns";
import { combineModules } from "../../shared/schema/modules";
import { applyIdPrefix } from "../../shared/schema/transformers/applyIdPrefix";

async function main() {
  const schema = applyIdPrefix(combineModules(nounsDeployment.modules));
  console.log(printSchema(schema));
}

main();

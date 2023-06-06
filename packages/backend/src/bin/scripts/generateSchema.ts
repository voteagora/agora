import { printSchema } from "graphql";

import { nounsDeployment } from "../../deployments/nouns";
import { combineModules } from "../../shared/schema/modules";
import { applyIdPrefix } from "../../shared/schema/transformers/applyIdPrefix";
import { Env } from "../../shared/types";

async function main() {
  const env = (process.env.ENVIRONMENT || "dev") as Env;
  const schema = applyIdPrefix(combineModules(nounsDeployment(env).modules));
  console.log(printSchema(schema));
}

main();

import { printSchema } from "graphql";

import { makeGatewaySchema } from "../../schema";

async function main() {
  const schema = makeGatewaySchema();
  console.log(printSchema(schema));
}

main();

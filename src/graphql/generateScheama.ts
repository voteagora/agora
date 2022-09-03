import { makeGatewaySchema } from "./schema";
import { printSchema } from "graphql";

async function main() {
  const schema = await makeGatewaySchema();
  console.log(printSchema(schema));
}

main();

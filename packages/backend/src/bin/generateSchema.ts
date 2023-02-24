import { makeGatewaySchema } from "../schema/index";
import { printSchema } from "graphql";

async function main() {
  const schema = makeGatewaySchema();
  console.log(printSchema(schema));
}

main();

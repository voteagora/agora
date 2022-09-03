import "isomorphic-fetch";

import { createServer } from "@graphql-yoga/node";
import { makeGatewaySchema } from "./schema";

async function main() {
  const schema = await makeGatewaySchema();

  const server = createServer({ schema, port: 4001, maskedErrors: false });
  await server.start();
}

main();

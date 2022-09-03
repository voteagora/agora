import { stitchSchemas } from "@graphql-tools/stitch";
import { loadSchema } from "@graphql-tools/load";
import { print } from "graphql";
import { fetchFn } from "../graphql/fetchFn";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { createServer } from "@graphql-yoga/node";

async function makeGatewaySchema() {
  return stitchSchemas({
    subschemas: [
      {
        schema: await loadSchema("./schema.graphql", {
          loaders: [new GraphQLFileLoader()],
        }),
        async executor({ document, variables }) {
          const query = print(document);
          return await fetchFn(query, variables);
        },
      },
    ],
  });
}

async function main() {
  const schema = await makeGatewaySchema();

  const server = createServer({ schema, port: 4001 });
  await server.start();
}

main();

import { stitchSchemas } from "@graphql-tools/stitch";
import { loadSchema } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { print } from "graphql";
import { fetchFn } from "./fetchFn";

export async function makeGatewaySchema() {
  return stitchSchemas({
    subschemas: [
      {
        schema: await loadSchema(
          "./src/graphql/schemas/nouns-subgraph.graphql",
          {
            loaders: [new GraphQLFileLoader()],
          }
        ),
        async executor({ document, variables }) {
          const query = print(document);
          return await fetchFn(query, variables);
        },
      },
    ],
  });
}

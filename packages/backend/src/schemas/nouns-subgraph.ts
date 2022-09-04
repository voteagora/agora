import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { loadSchema } from "@graphql-tools/load";
import { GraphQLSchema, print } from "graphql";
import { wrapSchema } from "@graphql-tools/wrap";
import fetch from "node-fetch";

export async function makeNounsSchema(): Promise<GraphQLSchema> {
  return wrapSchema({
    schema: await loadSchema("./src/schemas/nouns-subgraph.graphql", {
      loaders: [new GraphQLFileLoader()],
    }),
    async executor({ document, variables }) {
      const response = await fetch(
        "https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            query: print(document),
            variables,
          }),
        }
      );

      return (await response.json()) as any;
    },
  });
}

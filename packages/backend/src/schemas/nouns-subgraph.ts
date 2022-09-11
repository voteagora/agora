import { buildSchema, GraphQLSchema, print } from "graphql";
import { wrapSchema } from "@graphql-tools/wrap";
import schema from "./nouns-subgraph.graphql";

export function makeNounsSchema(): GraphQLSchema {
  return wrapSchema({
    schema: buildSchema(schema),
    executor: async function executor({ document, variables }) {
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

import { buildSchema, GraphQLSchema, print } from "graphql";
import { wrapSchema } from "@graphql-tools/wrap";
import schema from "./nouns-subgraph.graphql";
import { createBatchingExecutor } from "@graphql-tools/batch-execute";

export async function makeNounsSchema(): Promise<GraphQLSchema> {
  return wrapSchema({
    schema: buildSchema(schema),
    executor: createBatchingExecutor(async function executor({
      document,
      variables,
    }) {
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
    }),
  });
}

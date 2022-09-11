import { buildSchema, GraphQLSchema, print } from "graphql";
import { wrapSchema } from "@graphql-tools/wrap";
import schema from "./nouns-subgraph.graphql";
import { Executor } from "@graphql-tools/utils";
import { AgoraContextType } from "../model";
import { createBatchingExecutor } from "@graphql-tools/batch-execute";

export function makeNounsSchema(): GraphQLSchema {
  return wrapSchema({
    schema: buildSchema(schema),
    executor: ((args) => {
      const context: AgoraContextType = args.context as any;
      return context.nounsExecutor(args);
    }) as any,
  });
}

const executor: Executor = async function nounsSubgraphExecutor({
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
};

export function makeNounsExecutor(): Executor {
  return createBatchingExecutor(executor);
}

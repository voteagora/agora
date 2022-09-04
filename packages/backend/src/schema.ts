import { stitchSchemas } from "@graphql-tools/stitch";
import { loadSchema } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { print } from "graphql";
import fetch from "node-fetch";
import { getTitleFromProposalDescription } from "./utils/markdown";

export async function makeGatewaySchema() {
  return stitchSchemas({
    subschemas: [
      {
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
      },
    ],

    typeDefs: `
      extend type Proposal {
        title: String
      }
    `,

    resolvers: {
      Proposal: {
        title: {
          selectionSet: `{ description }`,
          resolve(proposal) {
            return getTitleFromProposalDescription(proposal.description);
          },
        },
      },
    },
  });
}

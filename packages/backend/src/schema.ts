import { stitchSchemas } from "@graphql-tools/stitch";
import { loadSchema } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { print } from "graphql";
import fetch from "node-fetch";
import { getTitleFromProposalDescription } from "./utils/markdown";
import { ethers } from "ethers";
import {
  NounsDAOLogicV1__factory,
  NounsToken__factory,
} from "./contracts/generated";

export async function makeGatewaySchema() {
  const provider = new ethers.providers.AlchemyProvider(
    null,
    process.env.ALCHEMY_API_KEY
  );
  const nounsDaoLogicV1 = NounsDAOLogicV1__factory.connect(
    "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d",
    provider
  );

  const nounsToken = NounsToken__factory.connect(
    "0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03",
    provider
  );

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
      
      extend type Query {
        metrics: OverallMetrics!
      }
      
      type OverallMetrics {
        totalSupply: BigInt!
        proposalCount: BigInt!
        quorumVotes: BigInt!
        quorumVotesBPS: BigInt!
        proposalThreshold: BigInt!
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

      Query: {
        metrics: {
          resolve() {
            return {};
          },
        },
      },

      OverallMetrics: {
        totalSupply: {
          async resolve() {
            return (await nounsToken.totalSupply()).toString();
          },
        },

        proposalCount: {
          async resolve() {
            return (await nounsDaoLogicV1.proposalCount()).toString();
          },
        },

        quorumVotes: {
          async resolve() {
            const votes = (await nounsDaoLogicV1.quorumVotes()).toString();

            return votes;
          },
        },

        quorumVotesBPS: {
          async resolve() {
            return (await nounsDaoLogicV1.quorumVotesBPS()).toString();
          },
        },

        proposalThreshold: {
          async resolve() {
            return (await nounsDaoLogicV1.proposalThreshold()).toString();
          },
        },
      },
    },
  });
}

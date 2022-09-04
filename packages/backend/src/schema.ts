import { stitchSchemas } from "@graphql-tools/stitch";
import { loadSchema } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { print } from "graphql";
import fetch from "node-fetch";
import { getTitleFromProposalDescription } from "./utils/markdown";
import { ethers } from "ethers";
import {
  NNSENSReverseResolver__factory,
  NounsDAOLogicV1__factory,
  NounsToken__factory,
} from "./contracts/generated";
import { delegateToSchema } from "@graphql-tools/delegate";
import { OperationTypeNode } from "graphql";

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

  const resolver = NNSENSReverseResolver__factory.connect(
    "0x5982cE3554B18a5CF02169049e81ec43BFB73961",
    provider
  );

  const nounsSchema = {
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
  };

  return stitchSchemas({
    subschemas: [nounsSchema],

    typeDefs: `
      extend type Proposal {
        title: String
      }
      
      extend type Query {
        metrics: OverallMetrics!
        address(address: ID!): Address!
      }
      
      type Address {
        resolvedName: ResolvedName!
        account: Account
      }
      
      type OverallMetrics {
        totalSupply: BigInt!
        proposalCount: BigInt!
        quorumVotes: BigInt!
        quorumVotesBPS: BigInt!
        proposalThreshold: BigInt!
      }
      
      extend type Delegate {
        resolvedName: ResolvedName!
      }
      
      type ResolvedName {
        address: ID!
        name: String
      }
    `,

    resolvers: {
      Proposal: {
        title: {
          selectionSet: `{ description }`,
          resolve({ description }) {
            return getTitleFromProposalDescription(description);
          },
        },
      },

      Query: {
        metrics: {
          resolve() {
            return {};
          },
        },

        address: {
          resolve(_, { address }) {
            return { address };
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

      Delegate: {
        resolvedName: {
          selectionSet: `{ id }`,
          resolve({ id }) {
            return { address: id };
          },
        },
      },

      Address: {
        resolvedName: {
          resolve({ address }) {
            return { address };
          },
        },

        account: {
          resolve({ address }, args, context, info) {
            return delegateToSchema({
              schema: nounsSchema,
              operation: OperationTypeNode.QUERY,
              fieldName: "account",
              args: { id: address },
              context,
              info,
            });
          },
        },
      },

      ResolvedName: {
        name: {
          async resolve({ address }) {
            const resolved = await resolver.resolve(address);
            if (!resolved) {
              return null;
            }

            return resolved;
          },
        },
      },
    },
  });
}

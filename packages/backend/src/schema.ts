import { stitchSchemas } from "@graphql-tools/stitch";
import { getTitleFromProposalDescription } from "./utils/markdown";
import { makeNounsSchema } from "./schemas/nouns-subgraph";
import { delegateToSchema } from "@graphql-tools/delegate";
import { OperationTypeNode } from "graphql";
import { promises as fs } from "fs";
import { ethers } from "ethers";
import {
  NNSENSReverseResolver__factory,
  NounsDAOLogicV1__factory,
  NounsToken__factory,
} from "./contracts/generated";

export async function makeGatewaySchema() {
  const nounsSchema = await makeNounsSchema();

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

  return stitchSchemas({
    subschemas: [nounsSchema],

    typeDefs: (
      await fs.readFile("./src/schemas/extensions.graphql")
    ).toString(),

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
            return { address: address.toLowerCase() };
          },
        },
      },

      Mutation: {
        createNewDelegateStatement: {
          resolve(...args) {
            console.log(...args);
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

      Account: {
        address: {
          selectionSet: `{ id }`,
          resolve({ id }) {
            return { address: id.toLowerCase() };
          },
        },
      },

      Address: {
        resolvedName: {
          resolve({ address }) {
            return { address };
          },
        },

        account({ address }, args, context, info) {
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

import "isomorphic-fetch";
import { Plugin } from "@graphql-yoga/common";
import { createServer } from "@graphql-yoga/node";
import { makeGatewaySchema } from "../schema";
import { useTiming } from "@envelop/core";
import { AgoraContextType } from "../model";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { ValidatedMessage } from "../utils/signing";
import {
  makeEmptyTracingContext,
  makeFakeSpan,
  makeNoOpCache,
} from "../utils/cache";
import { useApolloTracing } from "@envelop/apollo-tracing";
import { promises as fs } from "fs";
import { parseStorage } from "../snapshot";
import { z } from "zod";
import { makeDynamoStatementStorage } from "../store/dynamo/statement";
import { makeDynamoDelegateStore } from "../store/dynamo/delegates";
import { ethers } from "ethers";
import { TransparentMultiCallProvider } from "../multicall";

const snapshotVoteSchema = z.array(
  z.object({
    choice: z.array(z.number()).or(z.number()),
    created: z.number(),
    id: z.string(),
    reason: z.string(),
    voter: z.string(),
    proposal: z.object({
      id: z.string(),
    }),
  })
);

const snapshotProposalsSchema = z.object({
  proposals: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      link: z.string(),
      choices: z.array(z.string()),
      scores: z.array(z.number()),
    })
  ),
});

export async function getSnapshotVotes() {
  const votes = snapshotVoteSchema.parse(
    JSON.parse(
      await fs.readFile("./data/snapshot/ens.eth/votes.json", {
        encoding: "utf-8",
      })
    )
  );

  const proposals = snapshotProposalsSchema.parse(
    JSON.parse(
      await fs.readFile("./data/snapshot/ens.eth/proposals.json", {
        encoding: "utf-8",
      })
    )
  );

  return {
    votes,
    proposals: proposals.proposals,
  };
}

async function main() {
  const schema = makeGatewaySchema();
  const baseProvider = new ethers.providers.CloudflareProvider();

  const snapshot = parseStorage(
    JSON.parse(await fs.readFile("snapshot.json", { encoding: "utf-8" }))
  );

  const snapshotVotes = await getSnapshotVotes();

  const dynamoDb = new DynamoDB({});

  const server = createServer({
    schema,
    context(): AgoraContextType {
      const provider = new TransparentMultiCallProvider(baseProvider);

      return {
        provider,
        snapshot,
        snapshotVotes,
        delegateStorage: makeDynamoDelegateStore(dynamoDb),
        statementStorage: makeDynamoStatementStorage(dynamoDb),

        cache: {
          cache: makeNoOpCache(),
          waitUntil: () => {},
          span: makeFakeSpan(),
        },
        emailStorage: {
          async addEmail(verifiedEmail: ValidatedMessage): Promise<void> {
            console.log({ verifiedEmail });
          },
        },
        tracingContext: makeEmptyTracingContext(),
      };
    },
    port: 4001,
    maskedErrors: false,
    plugins: [useTiming(), useApolloTracing(), useErrorInspection()],
  });
  await server.start();
}

function useErrorInspection(): Plugin<AgoraContextType> {
  return {
    onResolverCalled({ info, context }) {
      return ({ result }) => {
        if (result instanceof Error) {
          console.log(result, info.path);
          return result;
        }

        return result;
      };
    },
  };
}

main();

import "isomorphic-fetch";
import { Plugin } from "@graphql-yoga/common";
import { createServer } from "@graphql-yoga/node";
import { makeGatewaySchema } from "../schema";
import { useTiming } from "@envelop/core";
import { AgoraContextType, SnapshotVote } from "../model";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { ValidatedMessage } from "../utils/signing";
import {
  makeEmptyTracingContext,
  makeFakeSpan,
  makeNoOpCache,
} from "../utils/cache";
import { useApolloTracing } from "@envelop/apollo-tracing";
import { parseStorage } from "../snapshot";
import { makeDynamoStatementStorage } from "../store/dynamo/statement";
import { makeDynamoDelegateStore } from "../store/dynamo/delegates";
import { ethers } from "ethers";
import { TransparentMultiCallProvider } from "../multicall";
import { makeSnapshotVoteStorage } from "../store/dynamo/snapshotVotes";
import { promises as fs } from "fs";

async function main() {
  const schema = makeGatewaySchema();
  const baseProvider = new ethers.providers.CloudflareProvider();

  const snapshot = parseStorage(
    JSON.parse(await fs.readFile("snapshot.json", { encoding: "utf-8" }))
  );

  const dynamoDb = new DynamoDB({});

  const server = createServer({
    schema,
    context(): AgoraContextType {
      const provider = new TransparentMultiCallProvider(baseProvider);

      return {
        provider,
        snapshot,
        snapshotVoteStorage: makeSnapshotVoteStorage(dynamoDb),
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

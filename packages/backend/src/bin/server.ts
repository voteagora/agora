import "isomorphic-fetch";
import { createServer } from "@graphql-yoga/node";
import { makeGatewaySchema } from "../schema";
import { useTiming } from "@envelop/core";
import { AgoraContextType } from "../model";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { ValidatedMessage } from "../utils/signing";
import { makeEmptyTracingContext, makeFakeSpan } from "../utils/cache";
import { useApolloTracing } from "@envelop/apollo-tracing";
import { parseStorage } from "../snapshot";
import { makeDynamoStatementStorage } from "../store/dynamo/statement";
import { makeDynamoDelegateStore } from "../store/dynamo/delegates";
import { ethers } from "ethers";
import { TransparentMultiCallProvider } from "../multicall";
import { makeSnapshotVoteStorage } from "../store/dynamo/snapshotVotes";
import { promises as fs } from "fs";
import { useErrorInspection } from "../useErrorInspection";
import { followChain } from "../indexer/followChain";
import { LevelEntityStore } from "../indexer/entityStore";
import { entityDefinitions, indexers } from "../indexer/contracts";
import { LevelReader } from "../indexer/reader";

async function main() {
  const schema = makeGatewaySchema();
  const store = await LevelEntityStore.open();

  const baseProvider = new ethers.providers.AlchemyProvider(
    "optimism",
    process.env.ALCHEMY_API_KEY
  );

  const storageArea = followChain(store, indexers, baseProvider);
  const reader = new LevelReader(entityDefinitions, store.level, storageArea);

  const dynamoDb = new DynamoDB({});

  const server = createServer({
    schema,
    async context(): Promise<AgoraContextType> {
      const provider = new TransparentMultiCallProvider(baseProvider);

      return {
        provider,
        snapshot: parseStorage(
          JSON.parse(await fs.readFile("snapshot.json", { encoding: "utf-8" }))
        ),
        snapshotVoteStorage: makeSnapshotVoteStorage(dynamoDb),
        delegateStorage: makeDynamoDelegateStore(dynamoDb),
        statementStorage: makeDynamoStatementStorage(dynamoDb),

        cache: {
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

main();

import "isomorphic-fetch";
import { createServer } from "@graphql-yoga/node";
import { makeGatewaySchema } from "../schema";
import { useTiming } from "@envelop/core";
import { AgoraContextType } from "../schema/context";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { ValidatedMessage } from "../utils/signing";
import { makeEmptyTracingContext, makeFakeSpan } from "../utils/cache";
import { useApolloTracing } from "@envelop/apollo-tracing";
import { ethers } from "ethers";
import { TransparentMultiCallProvider } from "../multicall";
import { useErrorInspection } from "../schema/plugins/useErrorInspection";
import { followChain, makeInitialStorageArea } from "../indexer/followChain";
import { indexers } from "../indexer/contracts";
import { LevelEntityStore } from "../indexer/storage/level/levelEntityStore";
import { LevelReader } from "../indexer/storage/level/levelReader";
import { timeout } from "../indexer/utils/asyncUtils";
import { EthersBlockProvider } from "../indexer/blockProvider/blockProvider";
import { EthersLogProvider } from "../indexer/logProvider/logProvider";
import { makeLatestBlockFetcher } from "../schema/latestBlockFetcher";
import { entityDefinitions } from "../indexer/contracts/entityDefinitions";
import { makeDynamoStatementStorage } from "../store/dynamo/statement";
import { makeProvider } from "../provider";

async function main() {
  const schema = makeGatewaySchema();
  const store = await LevelEntityStore.open();

  const baseProvider = makeProvider();

  const storageArea = await makeInitialStorageArea(store);
  const blockProvider = new EthersBlockProvider(baseProvider);
  const logProvider = new EthersLogProvider(baseProvider);
  const iter = followChain(
    store,
    indexers,
    entityDefinitions,
    blockProvider,
    logProvider,
    storageArea
  );
  const _ = (async () => {
    while (true) {
      const value = await iter();
      console.log({ value });
      switch (value.type) {
        case "TIP": {
          await timeout(1000);
        }
      }
    }
  })();

  const reader = new LevelReader(entityDefinitions, store.level, storageArea);

  const dynamoDb = new DynamoDB({});

  const server = createServer({
    schema,
    async context(): Promise<AgoraContextType> {
      const provider = new TransparentMultiCallProvider(baseProvider);

      return {
        ethProvider: new TransparentMultiCallProvider(makeProvider()),
        provider,
        reader,
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
        latestBlockFetcher: makeLatestBlockFetcher(baseProvider),
      };
    },
    port: 4001,
    maskedErrors: false,
    plugins: [useTiming(), useApolloTracing(), useErrorInspection()],
  });
  await server.start();
}

main();

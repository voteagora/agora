import "isomorphic-fetch";

import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { useApolloTracing } from "@envelop/apollo-tracing";
import { useTiming } from "@envelop/core";
import { createServer } from "@graphql-yoga/node";
import { ethers } from "ethers";

import { EthersBlockProvider } from "../indexer/blockProvider/blockProvider";
import { indexers } from "../indexer/contracts";
import { entityDefinitions } from "../indexer/contracts/entityDefinitions";
import { followChain, makeInitialStorageArea } from "../indexer/followChain";
import { EthersLogProvider } from "../indexer/logProvider/logProvider";
import { LevelEntityStore } from "../indexer/storage/level/levelEntityStore";
import { LevelReader } from "../indexer/storage/level/levelReader";
import { timeout } from "../indexer/utils/asyncUtils";
import { TransparentMultiCallProvider } from "../multicall";
import { makeProvider } from "../provider";
import { makeGatewaySchema } from "../schema";
import { AgoraContextType } from "../schema/context";
import { makeLatestBlockFetcher } from "../schema/latestBlockFetcher";
import { useErrorInspection } from "../schema/plugins/useErrorInspection";
import { makeDynamoStatementStorage } from "../store/dynamo/statement";
import { makeEmptyTracingContext, makeFakeSpan } from "../utils/cache";
import { ValidatedMessage } from "../utils/signing";

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

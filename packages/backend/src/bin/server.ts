import "isomorphic-fetch";
import { createServer } from "@graphql-yoga/node";
import { makeGatewaySchema } from "../schema";
import { useTiming } from "@envelop/core";
import { AgoraContextType } from "../schema/context";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { ValidatedMessage } from "../utils/signing";
import { makeEmptyTracingContext, makeFakeSpan } from "../utils/cache";
import { useApolloTracing } from "@envelop/apollo-tracing";
import { makeDynamoStatementStorage } from "../store/dynamo/statement";
import { ethers } from "ethers";
import { TransparentMultiCallProvider } from "../multicall";
import { makeSnapshotVoteStorage } from "../store/dynamo/snapshotVotes";
import { useErrorInspection } from "../schema/plugins/useErrorInspection";
import { followChain, makeInitialStorageArea } from "../indexer/followChain";
import { entityDefinitions, indexers } from "../indexer/contracts";
import { LevelEntityStore } from "../indexer/storage/level/levelEntityStore";
import { LevelReader } from "../indexer/storage/level/levelReader";
import { timeout } from "../indexer/utils/asyncUtils";
import { EthersBlockProvider } from "../indexer/blockProvider/blockProvider";
import { EthersLogProvider } from "../indexer/logProvider/logProvider";
import { makeLatestBlockFetcher } from "../schema/latestBlockFetcher";
import { startRestServer } from "./restServer";
import { startProxyServer } from "./proxyServer";
import { makeLikesStore } from "../services/likes";
import { makeBallotsStore } from "../services/ballot";

async function main() {
  const schema = makeGatewaySchema();
  const store = await LevelEntityStore.open();

  const baseProvider = new ethers.providers.AlchemyProvider(
    "optimism",
    process.env.ALCHEMY_API_KEY
  );

  const storageArea = await makeInitialStorageArea(store);

  // Start Indexer
  const blockProvider = new EthersBlockProvider(baseProvider);
  const logProvider = new EthersLogProvider(baseProvider);
  const iter = followChain(
    store,
    indexers,
    entityDefinitions,
    blockProvider,
    logProvider,
    baseProvider,
    storageArea,
    process.argv[2] || "dev"
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

  // Start GraphQL Server (Port 4002)
  const server = createServer({
    schema,
    async context(): Promise<AgoraContextType> {
      const provider = new TransparentMultiCallProvider(baseProvider);

      return {
        ethProvider: new TransparentMultiCallProvider(
          new ethers.providers.AlchemyProvider(
            "mainnet",
            process.env.ALCHEMY_API_KEY
          )
        ),
        latestBlockFetcher: makeLatestBlockFetcher(baseProvider),
        provider,
        reader,
        snapshotVoteStorage: makeSnapshotVoteStorage(dynamoDb),
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
        likesStore: makeLikesStore(),
        ballotsStore: makeBallotsStore(),
      };
    },
    port: 4002,
    maskedErrors: false,
    plugins: [useTiming(), useApolloTracing(), useErrorInspection()],
  });
  await server.start();

  // Start REST Server (Port 4003)
  startRestServer(baseProvider, reader);

  // Start Proxy Server (Port 4001)
  startProxyServer();
}

main();

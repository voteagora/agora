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

// p0
// todo: where are delegate statements going to be stored?
// todo: replicate and deploy
// todo: snapshot votes, delegate statements, cached ens name lookups

// todo: to load up a replica, have the durable object pull from an initial file from r2 using streams

// p1
// todo: derived state
// todo: joins
// todo: some cleanup in the governance folder

async function main() {
  const schema = makeGatewaySchema();
  const store = await LevelEntityStore.open();

  const baseProvider = new ethers.providers.AlchemyProvider(
    "optimism",
    process.env.ALCHEMY_API_KEY
  );

  const storageArea = await makeInitialStorageArea(store);
  const blockProvider = new EthersBlockProvider(baseProvider);
  const logProvider = new EthersLogProvider(baseProvider);
  const iter = followChain(
    store,
    indexers,
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
        ethProvider: new TransparentMultiCallProvider(
          new ethers.providers.AlchemyProvider(
            "mainnet",
            process.env.ALCHEMY_API_KEY
          )
        ),
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
      };
    },
    port: 4001,
    maskedErrors: false,
    plugins: [useTiming(), useApolloTracing(), useErrorInspection()],
  });
  await server.start();
}

main();

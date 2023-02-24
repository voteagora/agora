import { Env } from "./env";
import { makeGatewaySchema } from "../schema/index";
import { AgoraContextType } from "../schema/context";
import { makeEmailStorage } from "./storage";
import { makeDynamoClient } from "./dynamodb";
import { makeDynamoStatementStorage } from "../store/dynamo/statement";
import { ethers } from "ethers";
import { TransparentMultiCallProvider } from "../multicall";
import { makeSnapshotVoteStorage } from "../store/dynamo/snapshotVotes";
import { DurableObjectReader } from "../indexer/storage/durableObjects/durableObjectReader";
import { entityDefinitions } from "../indexer/contracts";
import { StorageArea } from "../indexer/followChain";
import { makeDynamoDelegateStore } from "../store/dynamo/delegates";
import { makeFakeSpan } from "../utils/cache";

// Initializing the schema takes about 250ms. We should avoid doing it once
// per request. We need to move this calculation into some kind of compile time
// step.
let gatewaySchema: ReturnType<typeof makeGatewaySchema> | null = null;

export async function getGraphQLCallingContext(
  request: Request,
  env: Env,
  storage: DurableObjectStorage,
  provider: ethers.providers.JsonRpcProvider,
  storageArea: StorageArea
) {
  if (!gatewaySchema) {
    gatewaySchema = makeGatewaySchema();
  }

  const dynamoClient = makeDynamoClient(env);

  const context: AgoraContextType = {
    ethProvider: (() => {
      const baseProvider = new ethers.providers.AlchemyProvider(
        "mainnet",
        env.ALCHEMY_API_KEY
      );
      return new TransparentMultiCallProvider(baseProvider);
    })(),
    provider,
    reader: new DurableObjectReader(entityDefinitions, storage, storageArea),
    snapshotVoteStorage: makeSnapshotVoteStorage(dynamoClient),
    statementStorage: makeDynamoStatementStorage(dynamoClient),
    delegateStorage: makeDynamoDelegateStore(dynamoClient),
    emailStorage: makeEmailStorage(env.EMAILS),
    tracingContext: {
      spanMap: new Map(),
      rootSpan: makeFakeSpan(),
    },
    cache: {
      span: makeFakeSpan(),
    },
  };

  return {
    schema: gatewaySchema,
    context,
  };
}

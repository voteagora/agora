import { ethers } from "ethers";

import { entityDefinitions } from "../indexer/contracts/entityDefinitions";
import { StorageArea } from "../indexer/followChain";
import { DurableObjectReader } from "../indexer/storage/durableObjects/durableObjectReader";
import { StorageInterface } from "../indexer/storage/durableObjects/storageInterface";
import { NopReader } from "../indexer/storage/nopReader";
import { Reader } from "../indexer/storage/reader";
import { TransparentMultiCallProvider } from "../multicall";
import { makeGatewaySchema } from "../schema";
import { AgoraContextType } from "../schema/context";
import { makeLatestBlockFetcher } from "../schema/latestBlockFetcher";
import { makeDynamoStatementStorage } from "../store/dynamo/statement";
import { makeEmptyTracingContext, makeFakeSpan } from "../utils/cache";

import { makeDynamoClient } from "./dynamodb";
import { Env, shouldAllowRead } from "./env";
import { makeEmailStorage } from "./storage";

// Initializing the schema takes about 250ms. We should avoid doing it once
// per request. We need to move this calculation into some kind of compile time
// step.
let gatewaySchema: ReturnType<typeof makeGatewaySchema> | null = null;

export async function getGraphQLCallingContext(
  request: Request,
  env: Env,
  storage: StorageInterface,
  provider: ethers.providers.JsonRpcProvider,
  storageArea: StorageArea
) {
  if (!gatewaySchema) {
    gatewaySchema = makeGatewaySchema();
  }

  const dynamoClient = makeDynamoClient(env);

  const allowRead = shouldAllowRead(env);

  const reader = allowRead
    ? new DurableObjectReader(entityDefinitions, storage, storageArea)
    : (new NopReader(storageArea) as Reader<typeof entityDefinitions>);

  const context: AgoraContextType = {
    ethProvider: (() => {
      const baseProvider = new ethers.providers.CloudflareProvider();
      return new TransparentMultiCallProvider(baseProvider);
    })(),
    provider,
    reader,
    statementStorage: makeDynamoStatementStorage(dynamoClient),
    emailStorage: makeEmailStorage(env.EMAILS),
    tracingContext: makeEmptyTracingContext(),
    cache: {
      span: makeFakeSpan(),
    },
    latestBlockFetcher: makeLatestBlockFetcher(provider),
  };

  return {
    schema: gatewaySchema,
    context,
  };
}

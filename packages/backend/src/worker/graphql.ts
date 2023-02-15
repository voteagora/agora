import { Env } from "./env";
import { makeGatewaySchema } from "../schema";
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
import { StorageInterface } from "../indexer/storage/durableObjects/storageInterface";
import { makeEmptyTracingContext, makeFakeSpan } from "../utils/cache";

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

  const context: AgoraContextType = {
    ethProvider: (() => {
      const baseProvider = new ethers.providers.CloudflareProvider();
      return new TransparentMultiCallProvider(baseProvider);
    })(),
    provider,
    reader: new DurableObjectReader(entityDefinitions, storage, storageArea),
    snapshotVoteStorage: makeSnapshotVoteStorage(dynamoClient),
    statementStorage: makeDynamoStatementStorage(dynamoClient),
    emailStorage: makeEmailStorage(env.EMAILS),
    tracingContext: makeEmptyTracingContext(),
    cache: {
      span: makeFakeSpan(),
    },
  };

  return {
    schema: gatewaySchema,
    context,
  };
}

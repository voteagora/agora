import { Env } from "./env";
import { makeGatewaySchema } from "../schema";
import { AgoraContextType } from "../schema/context";
import { makeEmailStorage } from "./storage";
import { getOrInitializeLatestSnapshot } from "./snapshot";
import { makeDynamoDelegateStore } from "../store/dynamo/delegates";
import { makeDynamoClient } from "./dynamodb";
import { makeDynamoStatementStorage } from "../store/dynamo/statement";
import { ethers } from "ethers";
import { TransparentMultiCallProvider } from "../multicall";
import { makeSnapshotVoteStorage } from "../store/dynamo/snapshotVotes";

// Initializing the schema takes about 250ms. We should avoid doing it once
// per request. We need to move this calculation into some kind of compile time
// step.
let gatewaySchema = null;

export async function getGraphQLCallingContext(
  request: Request,
  env: Env,
  ctx: ExecutionContext
) {
  if (!gatewaySchema) {
    gatewaySchema = makeGatewaySchema();
  }

  const latestSnapshot = await getOrInitializeLatestSnapshot(env);
  const dynamoClient = makeDynamoClient(env);

  const baseProvider = new ethers.providers.CloudflareProvider();
  const provider = new TransparentMultiCallProvider(baseProvider);

  const context: AgoraContextType = {
    provider,
    delegateStorage: makeDynamoDelegateStore(dynamoClient),
    snapshotVoteStorage: makeSnapshotVoteStorage(dynamoClient),
    snapshot: latestSnapshot,
    statementStorage: makeDynamoStatementStorage(dynamoClient),
    emailStorage: makeEmailStorage(env.EMAILS),
    tracingContext: {
      spanMap: new Map(),
      rootSpan: request.tracer,
    },
    cache: {
      span: request.tracer,
    },
  };

  return {
    schema: gatewaySchema,
    context,
  };
}

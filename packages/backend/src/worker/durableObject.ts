import { createServer, Plugin } from "@graphql-yoga/common";
import { Toucan } from "toucan-js";
import { ethers } from "ethers";
import { TransparentMultiCallProvider } from "@agora/common";

import { entityDefinitions, indexers } from "../deployments/nouns/indexers";
import { AnalyticsEngineReporter } from "../shared/indexer/storage/entityStore/durableObjects/storageInterface/analyticsEngineReporter";
import { useSentry } from "../shared/workers/sentry/useSentry";
import {
  exactPathMatcher,
  RouteDefinition,
} from "../shared/workers/router/route";
import { FollowChainDriver } from "../shared/workers/storageDurableObject/followChainDriver";
import { handleRoute } from "../shared/workers/router/handler";
import { makeDynamoClient } from "../shared/workers/dynamodb";
import { makeAdminRoutes, stopSentinel } from "../shared/workers/admin/handler";
import {
  isResultFinal,
  makeInitialStorageArea,
} from "../shared/indexer/process/followChain";
import { useTracing } from "../shared/schema/plugins/useTracing/useTracing";
import { ReadOnlySpan } from "../shared/workers/datadogTracer/types";
import { DatadogTracer } from "../shared/workers/datadogTracer/tracer";
import {
  handleAlarmWithTracer,
  handleFetchWithTracer,
} from "../shared/workers/datadogTracer/module";
import {
  handleAlarmWithSentry,
  handleFetchWithSentry,
} from "../shared/workers/sentry/module";
import { MakeOptionsResult } from "../shared/workers/sentry/makeOptions";
import { makeContext } from "../deployments/nouns";
import { makeLatestBlockFetcher } from "../shared/schema/context/latestBlockFetcher";
import { makeDynamoStatementStorage } from "../store/dynamo/statement";
import { loggingErrorReporter } from "../shared/schema/helpers/nonFatalErrors";
import { NopReader } from "../shared/indexer/storage/reader/nopReader";
import { Reader } from "../shared/indexer/storage/reader/type";
import { makeReader } from "../shared/indexer/storage/reader/reader";
import { DurableObjectEntityStore } from "../shared/indexer/storage/entityStore/durableObjects/durableObjectEntityStore";
import { CachedReader } from "../shared/indexer/storage/reader/cachedReader";
import { TracingProvider } from "../shared/tracingProvider";

import { makeEmailStorage } from "./storage";
import { getSchema } from "./getSchema";
import { makeToucanOptions } from "./sentry";
import { Env, shouldAllowRead } from "./env";
import { makeTracingOptions } from "./datadog";

export const blockUpdateIntervalSeconds = 10;

export class StorageDurableObjectV1 {
  private readonly state: DurableObjectState;
  private readonly env: Env;
  private readonly provider: ethers.providers.JsonRpcProvider;
  private readonly followChainDriver: FollowChainDriver;
  private readonly storageWithAnalyticsEngineReporter: AnalyticsEngineReporter;
  private readonly tracer: DatadogTracer;

  constructor(state: DurableObjectState, env: Env) {
    const provider = new ethers.providers.AlchemyProvider(
      "mainnet",
      env.ALCHEMY_API_KEY
    );

    this.state = state;
    this.env = env;
    this.provider = provider;
    this.storageWithAnalyticsEngineReporter = new AnalyticsEngineReporter(
      this.state.storage,
      env.STORAGE_ANALYTICS
    );

    this.followChainDriver = new FollowChainDriver(
      this.storageWithAnalyticsEngineReporter,
      provider,
      indexers,
      entityDefinitions
    );

    this.tracer = new DatadogTracer(
      makeTracingOptions(this.env, this.state.id.toString())
    );
  }

  private get toucanOptions(): MakeOptionsResult {
    const { options, tags } = makeToucanOptions({
      env: this.env,
      ctx: this.state,
    });

    return {
      options,
      tags: {
        ...tags,
        durableObjectName: "StorageDurableObjectV1",
        durableObjectId: this.state.id.toString(),
      },
    };
  }

  public async fetch(request: Request): Promise<Response> {
    return await handleFetchWithSentry(this.toucanOptions, request, (sentry) =>
      handleFetchWithTracer(this.tracer, request, this.state, (span) =>
        handleRoute(
          [
            makeGraphQLHandler(
              this.storageWithAnalyticsEngineReporter,
              sentry,
              span
            ),
            ...makeAdminRoutes(this.state, this.followChainDriver),
          ],
          request,
          this.env,
          this.state
        )
      )
    );
  }

  public async alarm() {
    await handleAlarmWithSentry(
      this.toucanOptions,
      async () =>
        await handleAlarmWithTracer(this.tracer, this.state, async () => {
          const stopSentinelValue = await this.state.storage.get(stopSentinel);
          if (stopSentinelValue) {
            await this.state.storage.delete(stopSentinel);
            return;
          }

          const result = await this.followChainDriver.stepChainForward();
          await this.state.storage.setAlarm(
            Date.now() +
              (() => {
                if (!isResultFinal(result)) {
                  return 0;
                }

                return 1000 * blockUpdateIntervalSeconds;
              })()
          );
        })
    );
  }
}

function makeGraphQLHandler(
  storage: AnalyticsEngineReporter,
  sentry: Toucan,
  span: ReadOnlySpan
): RouteDefinition<Env> {
  return {
    matcher: exactPathMatcher("/graphql"),
    handle: async (request, env) => {
      const provider = new ethers.providers.AlchemyProvider(
        "mainnet",
        env.ALCHEMY_API_KEY
      );

      const dynamo = makeDynamoClient({
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        accessKeyId: env.AWS_ACCESS_KEY_ID,
      });

      const entityStore = new DurableObjectEntityStore(storage);
      const storageArea = await makeInitialStorageArea(entityStore);
      const allowRead = shouldAllowRead(env);

      const reader = (() => {
        if (!allowRead) {
          return new NopReader(storageArea) as Reader<typeof entityDefinitions>;
        }

        return makeReader(entityStore, storageArea, entityDefinitions);
      })();

      try {
        const isProduction = env.ENVIRONMENT === "prod";

        const context = makeContext(
          {
            provider: new TransparentMultiCallProvider(
              new TracingProvider(provider)
            ),
            latestBlockFetcher: makeLatestBlockFetcher(provider),
            emailStorage: makeEmailStorage(env.EMAILS),
            statementStorage: makeDynamoStatementStorage(dynamo),
            errorReporter: loggingErrorReporter(),
          },
          new CachedReader(reader)
        );

        const server = createServer({
          schema: getSchema(),
          context,
          maskedErrors: isProduction,
          graphiql: !isProduction,
          plugins: [useSentry(sentry), useTracing(span, true)],
        });

        return await server.handleRequest(request);
      } finally {
        storage.flushIoReport(["kind:read"]);
      }
    },
  };
}

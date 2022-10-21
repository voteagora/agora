import {
  createServer,
  EnvelopError,
  handleStreamOrSingleExecutionResult,
  Plugin,
} from "@graphql-yoga/common";
import { makeGatewaySchema } from "./schema";
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import manifestJSON from "__STATIC_CONTENT_MANIFEST";
import { z } from "zod";
import {
  AgoraContextType,
  EmailStorage,
  StatementStorage,
  StoredStatement,
} from "./model";
import { makeNounsExecutor } from "./schemas/nouns-subgraph";
import { ValidatedMessage } from "./utils/signing";
import Toucan, { Options } from "toucan-js";
import {
  execute,
  GraphQLError,
  Kind,
  OperationDefinitionNode,
  parse,
  print,
  responsePathAsArray,
} from "graphql";
import { Scope } from "toucan-js/dist/scope";
import { Span, wrapModule } from "@cloudflare/workers-honeycomb-logger";
import { DrawDependencies, initSync } from "../../render-opengraph/pkg";
import opengraphQuery from "../../render-opengraph/src/OpenGraphRenderQuery.graphql";
import wasm from "../../render-opengraph/pkg/render_opengraph_bg.wasm";
import { filterForEventHandlers, makeReducers, parseStorage } from "./snapshot";
import { ethers } from "ethers";
import { NNSENSReverseResolver__factory } from "./contracts/generated";
import { getAllLogs } from "./events";

let drawDependenciesPromise = null;
function getDrawDependencies(
  kv: KVNamespace,
  manifest: Record<string, string>
): Promise<DrawDependencies> {
  if (drawDependenciesPromise) {
    return drawDependenciesPromise;
  }

  drawDependenciesPromise = (async () => {
    initSync(wasm);

    const [imagesRaw, interMedium, interBlack, dejavuBold] = await Promise.all([
      kv.get(manifest["worker-assets/image-data.json"], "text"),
      kv.get(manifest["worker-assets/Inter-Medium.otf"], "arrayBuffer"),
      kv.get(manifest["worker-assets/Inter-Black.otf"], "arrayBuffer"),
      kv.get(manifest["worker-assets/DejaVuSans-Bold.ttf"], "arrayBuffer"),
    ]);

    return DrawDependencies.create(
      imagesRaw,
      new Uint8Array(interMedium),
      new Uint8Array(interBlack),
      new Uint8Array(dejavuBold)
    );
  })();

  return drawDependenciesPromise;
}
const assetManifest = JSON.parse(manifestJSON);

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/worker.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/worker.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  ENVIRONMENT: "prod" | "dev" | "staging";
  DEPLOYMENT: string;
  SENTRY_DSN: string;
  GITHUB_SHA: string;

  STATEMENTS: KVNamespace;
  APPLICATION_CACHE: KVNamespace;
  EMAILS: KVNamespace;
  INDEXER: KVNamespace;
  __STATIC_CONTENT: KVNamespace;
}

const storedStatementSchema = z.object({
  updatedAt: z.number(),
  address: z.string(),
  signature: z.string(),
  signedPayload: z.string(),
});

function makeStatementStorage(kvNamespace: KVNamespace): StatementStorage {
  return {
    async addStatement(statement: StoredStatement): Promise<void> {
      await kvNamespace.put(
        statement.address.toLowerCase(),
        JSON.stringify(statement)
      );
    },

    async getStatement(address: string): Promise<StoredStatement | null> {
      const serializedValue = await kvNamespace.get(address.toLowerCase());
      if (!serializedValue) {
        return null;
      }

      const parsedStatement = JSON.parse(serializedValue);

      return storedStatementSchema.parse(parsedStatement) as any;
    },

    async listStatements(): Promise<string[]> {
      const entries = await kvNamespace.list();
      return entries.keys.map((item) => item.name.toLowerCase());
    },
  };
}

function makeEmailStorage(kvNamespace: KVNamespace): EmailStorage {
  return {
    async addEmail(verifiedEmail: ValidatedMessage): Promise<void> {
      await kvNamespace.put(
        verifiedEmail.address,
        JSON.stringify({
          signature: verifiedEmail.signature,
          value: verifiedEmail.value,
        })
      );
    },
  };
}

function makeCacheFromKvNamespace(kvNamespace: KVNamespace): ExpiringCache {
  return {
    async get(key: string): Promise<string | null> {
      return await kvNamespace.get(key);
    },
    async put(key: string, value: string): Promise<void> {
      await kvNamespace.put(key, value, { expirationTtl: 60 * 60 * 24 * 7 });
    },
  };
}

function skipError(error: Error): boolean {
  return error instanceof EnvelopError;
}

function addEventId(err: GraphQLError, eventId: string): GraphQLError {
  return new GraphQLError(
    err.message,
    err.nodes,
    err.source,
    err.positions,
    err.path,
    undefined,
    {
      ...err.extensions,
      sentryEventId: eventId,
    }
  );
}

function withSentryScope<T>(toucan: Toucan, fn: (scope: Scope) => T): T {
  let returnValue: T;

  toucan.withScope((scope) => {
    returnValue = fn(scope);
  });

  return returnValue;
}

const sentryTracingSymbol = Symbol("sentryTracing");

type SentryTracingContext = {
  opName: string;
  operationType: string;
};

function stringifyPath(path: ReadonlyArray<string | number>): string {
  return path.map((v) => (typeof v === "number" ? "$index" : v)).join(" > ");
}

const honeycombTracingSymbol = Symbol("honeycombTracing");

type SpanMap = Map<string, Span>;

function useSentry(sentry: Toucan): Plugin<AgoraContextType> {
  return {
    onResolverCalled({ info, context }) {
      return ({ result }) => {
        if (!(result instanceof Error) || skipError(result)) {
          return;
        }

        const { opName, operationType } = context[
          sentryTracingSymbol
        ] as SentryTracingContext;
        const path = responsePathAsArray(info.path);
        withSentryScope(sentry, (scope) => {
          scope.setFingerprint([
            "graphql",
            stringifyPath(path),
            opName,
            operationType,
          ]);

          sentry.captureException(result);
        });
      };
    },

    onExecute({ args, extendContext }) {
      const rootOperation = args.document.definitions.find(
        (o) => o.kind === Kind.OPERATION_DEFINITION
      ) as OperationDefinitionNode;

      const opName = args.operationName || rootOperation.name?.value;

      const operationType = rootOperation.operation;
      const document = print(args.document);

      const sentryContext: SentryTracingContext = {
        opName,
        operationType,
      };

      const rootSpan =
        args.contextValue.tracingContext.rootSpan.startChildSpan("graphql");
      rootSpan.addData({
        graphql: {
          operationName: opName,
          operation: operationType,
          variables: args.variableValues,
        },
      });

      extendContext({
        [sentryTracingSymbol]: sentryContext,
        tracingContext: { ...args.contextValue.tracingContext, rootSpan },
      } as any);

      return {
        onExecuteDone(payload) {
          rootSpan.finish();

          return handleStreamOrSingleExecutionResult(
            payload,
            ({ result, setResult }) => {
              if (!result.errors?.length) {
                return;
              }

              const errors = result.errors.map((error) => {
                const errorPathWithIndex = stringifyPath(error.path ?? []);

                const eventId = withSentryScope(sentry, (scope) => {
                  scope.setTag("operation", operationType);

                  if (opName) {
                    scope.setTag("operationName", opName);
                  }

                  scope.setExtra("document", document);
                  scope.setExtra("variables", args.variableValues);
                  scope.setExtra("path", error.path);

                  scope.setFingerprint([
                    "graphql",
                    errorPathWithIndex,
                    opName ?? "Anonymous Operation",
                    operationType,
                  ]);

                  return sentry.captureException(error);
                });

                return addEventId(error, eventId);
              });

              setResult({
                ...result,
                errors,
              });
            }
          );
        },
      };
    },
  };
}

async function getGraphQLCallingContext(
  request: Request,
  env: Env,
  ctx: ExecutionContext
) {
  if (!gatewaySchema) {
    gatewaySchema = makeGatewaySchema();
  }

  if (!latestSnapshot) {
    const snapshot = await loadSnapshot(env);
    latestSnapshot = parseStorage(snapshot);
  }

  const context: AgoraContextType = {
    snapshot: latestSnapshot,
    statementStorage: makeStatementStorage(env.STATEMENTS),
    emailStorage: makeEmailStorage(env.EMAILS),
    nounsExecutor: makeNounsExecutor(),
    tracingContext: {
      spanMap: new Map(),
      rootSpan: request.tracer,
    },
    cache: {
      cache: makeCacheFromKvNamespace(env.APPLICATION_CACHE),
      waitUntil(promise) {
        return ctx.waitUntil(promise);
      },
      span: request.tracer,
    },
  };

  return {
    schema: gatewaySchema,
    context,
  };
}

export function isStaticFile(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/+/, "");
  return assetManifest[path];
}

function wrapModuleSentry(
  makeOptions: (params: { env: Env; ctx: ExecutionContext }) => Options,
  generateHandlers: (sentry: Toucan) => ExportedHandler<Env>
): ExportedHandler<Env> {
  async function runReportingException<T>(
    sentry: Toucan,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      sentry.captureException(e);
      throw e;
    }
  }

  return {
    async fetch(...args): Promise<Response> {
      const [request, env, ctx] = args;

      const sentry = new Toucan({
        ...makeOptions({ env, ctx }),
        request,
      });

      sentry.setTags({
        deployment: env.DEPLOYMENT,
      });

      const handlers = generateHandlers(sentry);

      return await runReportingException(sentry, async () => {
        sentry.setTag("entrypoint", "fetch");
        return handlers.fetch?.(...args);
      });
    },
    async scheduled(...args) {
      const [event, env, ctx] = args;
      const sentry = new Toucan({
        ...makeOptions({ env, ctx }),
      });

      sentry.setTags({
        deployment: env.DEPLOYMENT,
      });

      const handlers = generateHandlers(sentry);

      return await runReportingException(sentry, async () => {
        sentry.setTag("entrypoint", "scheduled");
        sentry.setExtras({
          event: {
            scheduledTime: event.scheduledTime,
            cron: event.cron,
          },
        });
        return handlers.scheduled?.(...args);
      });
    },
  };
}

// Initializing the schema takes about 250ms. We should avoid doing it once
// per request. We need to move this calculation into some kind of compile time
// step.
let gatewaySchema = null;

let latestSnapshot = null;

async function loadSnapshot(env: Env) {
  return await env.INDEXER.get("snapshot.json", "json");
}

async function fetch(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  sentry: Toucan
) {
  const isProduction = env.ENVIRONMENT === "prod";
  const url = new URL(request.url);
  if (url.pathname === "/graphql") {
    const { schema, context } = await getGraphQLCallingContext(
      request,
      env,
      ctx
    );

    const server = createServer({
      schema,
      context,
      maskedErrors: isProduction,
      graphiql: !isProduction,
      plugins: [useSentry(sentry)],
    });

    return server.handleRequest(request, { env, ctx });
  }

  if (isStaticFile(request)) {
    return await getAssetFromKV(
      {
        request,
        waitUntil(promise) {
          return ctx.waitUntil(promise);
        },
      },
      {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
      }
    );
  }

  const openGraphImageUrlMatch = url.pathname.match(
    /^\/images\/opengraph\/(.+)\/image\.png$/
  );
  if (openGraphImageUrlMatch) {
    const address = decodeURIComponent(openGraphImageUrlMatch[1]);
    const key = `opengraph-2-${address}`;
    const fromCache = await env.APPLICATION_CACHE.get(key, "stream");
    if (fromCache) {
      return new Response(fromCache);
    }

    const { schema, context } = await getGraphQLCallingContext(
      request,
      env,
      ctx
    );

    const document = parse(opengraphQuery);

    const result = await execute({
      schema,
      document,
      variableValues: {
        address,
      },
      contextValue: context,
    });

    const draw = await getDrawDependencies(env.__STATIC_CONTENT, assetManifest);
    const response = draw.draw_image(JSON.stringify(result.data));
    if (!response) {
      return new Response("not found", { status: 404 });
    }

    ctx.waitUntil(
      env.APPLICATION_CACHE.put(key, response, {
        expirationTtl: 60 * 60 * 24 * 7,
      })
    );
    return new Response(response);
  }

  const content = await env.__STATIC_CONTENT.get(assetManifest["index.html"]);

  const imageReplacementValue = (() => {
    const pathMatch = url.pathname.match(/^\/delegate\/(.+)$/);
    if (pathMatch) {
      const delegateName = pathMatch[1];
      return `/images/opengraph/${delegateName}/image.png`;
    }

    return "/og.jpeg";
  })();

  return new Response(
    content.replaceAll("$$OG_IMAGE_SENTINEL$$", imageReplacementValue),
    {
      headers: {
        "content-type": "text/html; charset=UTF-8",
      },
    }
  );
}

async function scheduled(env: Env, sentry: Toucan) {
  const provider = new ethers.providers.AlchemyProvider();

  const resolver = NNSENSReverseResolver__factory.connect(
    "0x5982cE3554B18a5CF02169049e81ec43BFB73961",
    provider
  );

  const reducers = makeReducers(provider, resolver);
  const latestBlockNumber = await provider.getBlockNumber();

  const snapshot = await loadSnapshot(env);

  for (const reducer of reducers) {
    const filter = filterForEventHandlers(reducer);
    const snapshotValue = snapshot[reducer.name];
    let state = (() => {
      if (snapshotValue) {
        return reducer.decodeState(snapshotValue.state);
      }

      return reducer.initialState();
    })();

    const { logs, latestBlockFetched } = await getAllLogs(
      provider,
      filter,
      latestBlockNumber,
      snapshotValue?.block ?? reducer.startingBlock
    );

    let idx = 0;
    for (const log of logs) {
      await withSentryScope(sentry, async (scope) => {
        const event = reducer.iface.parseLog(log);
        const eventHandler = reducer.eventHandlers.find(
          (e) => e.signature === event.signature
        );

        try {
          state = await eventHandler.reduce(state, event, log);
        } catch (e) {
          scope.setExtras({
            event,
            log,
            logs: logs.length,
            idx,
          });
          sentry.captureException(e);
        }
        idx++;
      });
    }

    snapshot[reducer.name] = {
      state: reducer.encodeState(state),
      block: latestBlockFetched,
    };
  }

  await env.INDEXER.put("snapshot.json", JSON.stringify(snapshot));
  latestSnapshot = parseStorage(snapshot);
}

const sentryWrappedModule = wrapModuleSentry(
  ({ env, ctx }) => ({
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT,
    release: env.GITHUB_SHA,
    context: ctx,
    rewriteFrames: {
      root: "/",
    },
  }),
  (sentry) => ({
    async fetch(request, env: Env, ctx: ExecutionContext): Promise<Response> {
      return await fetch(request, env, ctx, sentry);
    },

    async scheduled(controller, env) {
      return await scheduled(env, sentry);
    },
  })
);

export default {
  ...wrapModule({}, sentryWrappedModule),
  scheduled: sentryWrappedModule.scheduled,
};

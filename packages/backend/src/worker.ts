import {
  createServer,
  EnvelopError,
  handleStreamOrSingleExecutionResult,
  Plugin,
} from "@graphql-yoga/common";
import { makeGatewaySchema } from "./schema";
import {
  getAssetFromKV,
  serveSinglePageApp,
} from "@cloudflare/kv-asset-handler";
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
import Toucan from "toucan-js";
import { ExpiringCache } from "./utils/cache";
import {
  GraphQLError,
  Kind,
  OperationDefinitionNode,
  print,
  responsePathAsArray,
} from "graphql";
import { Scope } from "toucan-js/dist/scope";
import { wrapModule, Span } from "@cloudflare/workers-honeycomb-logger";

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
  SENTRY_DSN: string;
  GITHUB_SHA: string;

  STATEMENTS: KVNamespace;
  APPLICATION_CACHE: KVNamespace;
  EMAILS: KVNamespace;
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
  spanMap: Map<string, Span>;
  rootSpan: Span;
  opName: string;
  operationType: string;
};

function stringifyPath(path: ReadonlyArray<string | number>): string {
  return path.map((v) => (typeof v === "number" ? "$index" : v)).join(" > ");
}

function useSentry(sentry: Toucan, span: Span): Plugin<AgoraContextType> {
  return {
    onResolverCalled({ info, context, resolverFn, replaceResolverFn }) {
      const { rootSpan, opName, operationType, spanMap } = context[
        sentryTracingSymbol
      ] as SentryTracingContext;

      const path = responsePathAsArray(info.path);
      const filteredPath = path.filter(
        (segment) => typeof segment === "string"
      );

      const parentPath = stringifyPath(filteredPath.slice(0, -1));
      const stringPath = stringifyPath(filteredPath);

      const retrievedParentSpan = spanMap.get(parentPath);
      const parentSpan = retrievedParentSpan ?? rootSpan;

      const span = parentSpan.startChildSpan(
        `${info.parentType.name}.${info.fieldName}`
      );
      span.addData({
        graphql: {
          path,
        },
      });
      spanMap.set(stringPath, span);

      replaceResolverFn((parentValue, args, context, info) => {
        return resolverFn(
          parentValue,
          args,
          { ...context, cache: { ...context.cache, span } },
          info
        );
      });

      return ({ result }) => {
        span.finish();

        if (result instanceof Error && !skipError(result)) {
          withSentryScope(sentry, (scope) => {
            scope.setFingerprint([
              "graphql",
              stringifyPath(path),
              opName,
              operationType,
            ]);

            sentry.captureException(result);
          });
        }
      };
    },

    onExecute({ args, extendContext, executeFn, setExecuteFn }) {
      const rootOperation = args.document.definitions.find(
        (o) => o.kind === Kind.OPERATION_DEFINITION
      ) as OperationDefinitionNode;

      const opName = args.operationName || rootOperation.name?.value;

      const operationType = rootOperation.operation;
      const document = print(args.document);

      const rootSpan = span.startChildSpan(opName);
      rootSpan.addData({
        graphql: {
          document,
          variables: args.variableValues,
          operationType,
        },
      });

      const sentryContext: SentryTracingContext = {
        spanMap: new Map<string, Span>(),
        rootSpan,
        opName,
        operationType,
      };
      extendContext({ [sentryTracingSymbol]: sentryContext } as any);

      return {
        onExecuteDone(payload) {
          return handleStreamOrSingleExecutionResult(
            payload,
            ({ result, setResult }) => {
              rootSpan.finish();

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

// Initializing the schema takes about 250ms. We should avoid doing it once
// per request. We need to move this calculation into some kind of compile time
// step.
let gatewaySchema = null;

export default wrapModule(
  {},
  {
    async fetch(request, env: Env, ctx: ExecutionContext): Promise<Response> {
      const sentry = new Toucan({
        dsn: env.SENTRY_DSN,
        environment: env.ENVIRONMENT,
        release: env.GITHUB_SHA,
        context: ctx,
        request,
        rewriteFrames: {
          root: "/",
        },
      });

      try {
        const isProduction = env.ENVIRONMENT === "prod";
        const url = new URL(request.url);
        if (url.pathname === "/graphql") {
          if (!gatewaySchema) {
            gatewaySchema = makeGatewaySchema();
          }

          const context: AgoraContextType = {
            statementStorage: makeStatementStorage(env.STATEMENTS),
            emailStorage: makeEmailStorage(env.EMAILS),
            nounsExecutor: makeNounsExecutor(),
            cache: {
              cache: makeCacheFromKvNamespace(env.APPLICATION_CACHE),
              waitUntil(promise) {
                return ctx.waitUntil(promise);
              },
            } as any,
          };

          const server = createServer({
            schema: gatewaySchema,
            context,
            maskedErrors: isProduction,
            graphiql: !isProduction,
            plugins: [useSentry(sentry, request.tracer)],
          });

          return server.handleRequest(request, { env, ctx });
        } else {
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
              mapRequestToAsset: serveSinglePageApp,
            }
          );
        }
      } catch (e) {
        sentry.captureException(e);
        throw e;
      }
    },
  }
);

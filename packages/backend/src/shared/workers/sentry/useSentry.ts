import { Toucan } from "toucan-js";
import {
  defaultFieldResolver,
  GraphQLError,
  GraphQLResolveInfo,
  print,
  responsePathAsArray,
} from "graphql";
import {
  EnvelopError,
  handleStreamOrSingleExecutionResult,
  Plugin,
} from "@graphql-yoga/common";
import { Scope } from "@sentry/core";
import { MapperKind, mapSchema } from "@graphql-tools/utils";

import { ErrorReporter } from "../../schema/helpers/nonFatalErrors";
import { onSchemaChangedOnce } from "../../schema/plugins/onSchemaChangedOnce";

import { captureException } from "./capture";

export function useSentry(
  sentry: Toucan
): Plugin<{ errorReporter: ErrorReporter }> {
  return {
    ...onSchemaChangedOnce("useSentry", ({ schema, replaceSchema }) => {
      replaceSchema(
        mapSchema(schema, {
          [MapperKind.OBJECT_FIELD](fieldConfig) {
            if (
              !fieldConfig.resolve ||
              fieldConfig.resolve === defaultFieldResolver
            ) {
              return fieldConfig;
            }

            return {
              ...fieldConfig,
              async resolve(...resolverArgs) {
                if (!fieldConfig.resolve) {
                  return defaultFieldResolver(...resolverArgs);
                }

                const [parentValue, args, context, info] = resolverArgs;
                return fieldConfig.resolve(
                  parentValue,
                  args,
                  {
                    ...context,
                    errorReporter: makeErrorReporter(sentry, info),
                  },
                  info
                );
              },
            };
          },
        })
      );
    }),
    onResolverCalled({ info }) {
      return ({ result, setResult }) => {
        if (!(result instanceof Error) || skipError(result)) {
          return;
        }

        const errorId = captureExceptionWithGraphQLContext(
          sentry,
          info,
          result
        );
        setResult(new WrappedError(errorId, result));
      };
    },

    onExecute() {
      return {
        onExecuteDone(payload) {
          return handleStreamOrSingleExecutionResult(
            payload,
            ({ result, setResult }) => {
              if (!result.errors?.length) {
                return;
              }

              const errors = result.errors.map((error) =>
                unwrapWrappedError(error)
              );

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

export function makeErrorReporter(
  sentry: Toucan,
  info: GraphQLResolveInfo
): ErrorReporter {
  return {
    captureException(error: unknown) {
      captureExceptionWithGraphQLContext(sentry, info, error);
    },
  };
}

function captureExceptionWithGraphQLContext(
  sentry: Toucan,
  info: GraphQLResolveInfo,
  result: unknown
) {
  return withSentryScope(sentry, (scope) => {
    const path = responsePathAsArray(info.path);
    const operationType = info.operation.operation;
    const opName = info.operation.name?.value;

    const document = print(info.operation);

    scope.setExtras({
      path,
      operation: operationType,
      operationName: opName,
      variables: info.variableValues,
      document,
    });

    scope.setFingerprint([
      "graphql",
      stringifyPath(path),
      operationType,
      opName ?? "defaultOperationName",
    ]);

    return captureException(sentry, result);
  });
}

function skipError(error: Error): boolean {
  return error instanceof EnvelopError;
}

function stringifyPath(path: ReadonlyArray<string | number>): string {
  return path.map((v) => (typeof v === "number" ? "$index" : v)).join(" > ");
}

function unwrapWrappedError(err: GraphQLError): GraphQLError {
  const wrappedError = err.originalError;
  if (!(wrappedError instanceof WrappedError)) {
    return err;
  }

  return new GraphQLError(err.message, {
    nodes: err.nodes,
    source: err.source,
    positions: err.positions,
    path: err.path,
    originalError: wrappedError.originalError,
    extensions: {
      ...err.extensions,
      sentryEventId: wrappedError.eventId,
    },
  });
}

function withSentryScope<T>(toucan: Toucan, fn: (scope: Scope) => T): T {
  let returnValue: T;

  toucan.withScope((scope) => {
    returnValue = fn(scope as any);
  });

  return returnValue!;
}

class WrappedError extends Error {
  constructor(readonly eventId: string, readonly originalError: Error) {
    super(originalError.message);
  }
}

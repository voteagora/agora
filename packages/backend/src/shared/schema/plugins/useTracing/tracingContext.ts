import { MapperKind, mapSchema } from "@graphql-tools/utils";
import {
  defaultFieldResolver,
  GraphQLSchema,
  responsePathAsArray,
} from "graphql";

import { ReadOnlySpan } from "../../../workers/datadogTracer/types";
import { withSpanContext } from "../../../workers/datadogTracer/contextSpan";
import { flattenMetaInputType } from "../../../workers/datadogTracer/flatten";

export function attachTracingContextInjection(
  schema: GraphQLSchema
): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD](fieldConfig) {
      // Only apply to user-implemented resolvers. Default resolvers will
      // probably not have interesting information.
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
          if (!context.tracingContext) {
            throw new Error("tracing context not found");
          }

          const tracingContext: TracingContext = context.tracingContext;

          const path = responsePathAsArray(info.path);
          const parentSpan = getFirstMatchingParentSpan(
            tracingContext,
            path.slice(0, -1)
          );

          const span = parentSpan.startSpan({
            name: "graphql",
            resource: `${info.parentType.name}.${info.fieldName}`,
            meta: flattenMetaInputType({
              graphql: {
                path,
                args,
              },
            }),
          });

          tracingContext.spanMap.set(path.join(" > "), span);

          const resolver = fieldConfig.resolve;

          const response = await withSpanContext(
            span,
            async () => await resolver(parentValue, args, context, info)
          );

          span.finishSpan();

          return response;
        },
      };
    },
  });
}

function getFirstMatchingParentSpan(
  tracingContext: TracingContext,
  path: ReadonlyArray<string | number>
): ReadOnlySpan {
  if (!path.length) {
    return tracingContext.rootSpan;
  }

  const parentSpan = tracingContext.spanMap.get(path.join(" > "));
  if (parentSpan) {
    return parentSpan;
  }

  return getFirstMatchingParentSpan(tracingContext, path.slice(0, -1));
}

export type SpanMap = {
  get(key: string): ReadOnlySpan | undefined;
  set(key: string, span: ReadOnlySpan): void;
};

export type TracingContext = {
  spanMap: SpanMap;
  rootSpan: ReadOnlySpan;
};

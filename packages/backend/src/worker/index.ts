import { handleFetchWithSentry } from "../shared/workers/sentry/module";
import { handleRoute } from "../shared/workers/router/handler";
import {
  exactPathMatcher,
  startsWithPathMatcher,
} from "../shared/workers/router/route";
import { withCache } from "../shared/workers/router/cache";
import { staticFileRouteDefinitions } from "../shared/workers/router/static";
import { handleFetchWithTracer } from "../shared/workers/datadogTracer/module";
import { DatadogTracer } from "../shared/workers/datadogTracer/tracer";
import { ReadOnlySpan } from "../shared/workers/datadogTracer/types";
import {
  tracingMetaForRequest,
  tracingMetaForResponse,
} from "../shared/workers/datadogTracer/fetch";

import { makeToucanOptions } from "./sentry";
import {
  blockUpdateIntervalSeconds,
  StorageDurableObjectV1 as StorageDurableObjectV1Implementation,
} from "./durableObject";
import { Env, shouldUseCache } from "./env";
import { makeTracingOptions } from "./datadog";

function durableObjectHandler(
  parentSpan: ReadOnlySpan
): (request: Request, env: Env) => Promise<Response> {
  return async (request, env) => {
    const name =
      request.headers.get("x-durable-object-instance-name") ||
      env.PRIMARY_DURABLE_OBJECT_INSTANCE_NAME;

    const id = env.STORAGE_OBJECT.idFromName(name);
    const storageObject = env.STORAGE_OBJECT.get(id);

    const span = parentSpan.startSpan({
      name: "worker.durableObject",
      resource: "STORAGE_OBJECT",
      meta: {
        ...tracingMetaForRequest(request),
        "durableObject.id": id.toString(),
        "durableObject.name": name,
      },
    });

    const response = await storageObject.fetch(
      new Request(request, {
        headers: new Headers([
          ...Object.entries(span.contextHeaders()),
          ...Array.from(request.headers.entries()),
        ]),
      })
    );

    span.finishSpan({
      meta: tracingMetaForResponse(response),
    });

    return response;
  };
}

export default <ExportedHandler<Env>>{
  async fetch(request, env, ctx): Promise<Response> {
    return await handleFetchWithSentry(
      makeToucanOptions({ env, ctx }),
      request,
      async () => {
        return await handleFetchWithTracer(
          new DatadogTracer(makeTracingOptions(env)),
          request,
          ctx,
          (span) =>
            handleRoute(
              [
                {
                  matcher: exactPathMatcher("/graphql"),
                  handle: withCache(
                    durableObjectHandler(span),
                    shouldUseCache,
                    "graphql",
                    blockUpdateIntervalSeconds
                  ),
                },
                {
                  matcher: exactPathMatcher("/inspect"),
                  handle: durableObjectHandler(span),
                },
                {
                  matcher: startsWithPathMatcher("/admin"),
                  handle: durableObjectHandler(span),
                },
                ...staticFileRouteDefinitions(),
              ],
              request,
              env,
              ctx
            )
        );
      }
    );
  },
};

export { StorageDurableObjectV1Implementation as StorageDurableObjectV1 };

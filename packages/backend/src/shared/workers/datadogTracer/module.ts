import { DurableObjectId } from "@cloudflare/workers-types";

import { Context } from "../context";

import { ReadOnlySpan, Tracer } from "./types";
import { withSpan, withSpanContext } from "./contextSpan";
import { headerKeys } from "./fetch";
import { datadogParentIdHeaderKey, datadogTraceIdHeaderKey } from "./tracer";

function extractId(headers: Headers, key: string) {
  const headerValue = headers.get(key);
  if (!headerValue) {
    return;
  }

  return BigInt(headerValue);
}

export async function handleFetchWithTracer(
  tracer: Tracer,
  request: Request,
  ctx: Context & { id?: DurableObjectId },
  next: (span: ReadOnlySpan) => Promise<Response>
): Promise<Response> {
  const url = new URL(request.url);
  const span = tracer.startSpan(
    {
      name: "fetch",
      resource: url.pathname,
      meta: {
        "http.method": request.method,
        "http.url": request.url,
        ...headerKeys("request", request.headers),
        ...(() => {
          if (!ctx.id) {
            return;
          }

          return durableObjectFields(ctx.id);
        })(),
      },
      isTopLevel: true,
    },
    extractId(request.headers, datadogTraceIdHeaderKey),
    extractId(request.headers, datadogParentIdHeaderKey)
  );

  const response = await withSpanContext(span, async () => await next(span));

  span.finishSpan({
    meta: {
      ...headerKeys("response", response.headers),
    },
  });

  ctx.waitUntil(tracer.flushSpans());

  return response;
}

export async function handleAlarmWithTracer(
  tracer: Tracer,
  ctx: Context & { id: DurableObjectId },
  fn: () => Promise<void>
): Promise<void> {
  await withSpan(
    tracer.startSpan({
      name: "alarm",
      resource: "alarm",
      isTopLevel: true,
      meta: {
        ...durableObjectFields(ctx.id),
      },
    }),
    fn
  );

  ctx.waitUntil(tracer.flushSpans());
}

function durableObjectFields(id: DurableObjectId) {
  return {
    "durableObject.id": id.toString(),
    "durableObject.name": id.name,
  };
}

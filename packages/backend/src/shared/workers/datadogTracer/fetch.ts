import { ReadOnlySpan } from "./types";

export async function fetchWithTracer(
  parentSpan: ReadOnlySpan,
  request: Request
) {
  const span = parentSpan.startSpan({
    name: "http.request",
    resource: `${request.method} ${request.url}`,
    meta: tracingMetaForRequest(request),
  });

  // eslint-disable-next-line ban/ban
  const response = await fetch(request);

  span.finishSpan({
    meta: tracingMetaForResponse(response),
  });

  return response;
}

export function tracingMetaForRequest(
  request: Request
): Record<string, string> {
  return {
    "http.method": request.method,
    "http.url": request.url,
    ...headerKeys("request", request.headers),
  };
}

export function tracingMetaForResponse(
  response: Response
): Record<string, string> {
  return {
    "http.response.status_code": response.status.toString(),
    "http.response.status_text": response.statusText,
    ...headerKeys("response", response.headers),
  };
}

export function headerKeys(
  kind: "response" | "request",
  headers: Headers
): Record<string, string> {
  return Object.fromEntries(
    Array.from(headers.entries()).map(([key, value]) => [
      `http.${kind}.headers.${key.toLowerCase()}`,
      value,
    ])
  );
}

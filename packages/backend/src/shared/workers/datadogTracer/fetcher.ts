import { ReadOnlySpan } from "./types";
import { fetchWithTracer } from "./fetch";
import { getSpan } from "./contextSpan";

export type Fetcher = {
  fetch(request: Request): Promise<Response>;
};

export function makeDefaultFetcher(): Fetcher {
  return {
    fetch,
  };
}

export function makeFetcherWithTracer(span: ReadOnlySpan): Fetcher {
  return {
    async fetch(request: Request): Promise<Response> {
      return await fetchWithTracer(span, request);
    },
  };
}

function makeFetcherFromSpan(span: ReadOnlySpan | undefined) {
  if (!span) {
    return makeDefaultFetcher();
  }

  return makeFetcherWithTracer(span);
}

export function makeFetcher() {
  return makeFetcherFromSpan(getSpan());
}

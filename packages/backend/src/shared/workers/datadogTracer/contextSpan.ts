import { AsyncLocalStorage } from "node:async_hooks";

import { ReadOnlySpan, Span, SpanOptions } from "./types";

const asyncLocalStorage = new AsyncLocalStorage<Span>();

export function getSpan(): ReadOnlySpan | undefined {
  return asyncLocalStorage.getStore();
}

export async function withSpanContext<R>(
  span: Span,
  fn: () => Promise<R>
): Promise<R> {
  return asyncLocalStorage.run(span, fn);
}

export async function withSpan<R>(
  span: Span,
  fn: () => Promise<R>
): Promise<R> {
  const result = await withSpanContext(span, async () => await fn());

  span.finishSpan();

  return result;
}

export async function trace<T>(
  spanOptions: SpanOptions,
  fn: () => Promise<T>
): Promise<T> {
  const rootSpan = getSpan();
  if (!rootSpan) {
    return await fn();
  }

  const span = rootSpan.startSpan(spanOptions);

  const result = await fn();

  span.finishSpan();

  return result;
}

export type SpanOptions = {
  name?: string;
  resource?: string;
  meta?: Record<string, string | undefined>;
  metrics?: Record<string, number>;
  isTopLevel?: boolean;
};

export interface Tracer {
  startSpan(opts: SpanOptions, traceId?: bigint, parentSpanId?: bigint): Span;
  flushSpans(): Promise<void>;
}

export interface Span extends ReadOnlySpan {
  finishSpan(opts?: SpanOptions): void;
}

export interface ReadOnlySpan {
  startSpan(opts: SpanOptions): Span;
  contextHeaders(): Record<string, string>;
}

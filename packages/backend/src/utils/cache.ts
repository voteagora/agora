import {
  makeNopSpanMap,
  TracingContext,
} from "../schema/transformers/tracingContext";

export type Span = {
  startChildSpan(name: string): Span;
  addData(data: any): void;
  finish(): void;
};

export type CacheDependencies = {
  span: Span;
};

export function makeFakeSpan() {
  const fakeSpan = {
    startChildSpan() {
      return fakeSpan;
    },

    finish() {},
    addData() {},
  };

  return fakeSpan;
}

export function makeEmptyTracingContext(): TracingContext {
  return {
    rootSpan: makeFakeSpan() as any,
    spanMap: makeNopSpanMap(),
  };
}

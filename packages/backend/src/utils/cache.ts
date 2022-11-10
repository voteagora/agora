import { makeNopSpanMap, TracingContext } from "../model";

export type Span = {
  startChildSpan(name: string): Span;
  addData(data: any);
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
    rootSpan: makeFakeSpan(),
    spanMap: makeNopSpanMap(),
  };
}

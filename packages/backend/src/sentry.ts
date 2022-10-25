export interface Scope {
  setExtras(object: Record<string, unknown>);
}

export interface ToucanInterface {
  withScope(fn: (scope: Scope) => void): void;
  captureException(e: unknown): void;
}

export function withSentryScope<T>(
  toucan: ToucanInterface,
  fn: (scope: Scope) => T
): T {
  let returnValue: T;

  toucan.withScope((scope) => {
    returnValue = fn(scope);
  });

  return returnValue;
}

export function makeMockSentry(): ToucanInterface {
  return {
    captureException(e: unknown) {
      console.error(e);
    },

    withScope(fn: (scope: Scope) => void) {
      fn({
        setExtras(object: Record<string, unknown>) {},
      });
    },
  };
}

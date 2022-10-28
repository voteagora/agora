export interface Scope {
  setExtras(object: Record<string, unknown>);
}

export interface ToucanInterface<S extends Scope = Scope> {
  withScope(fn: (scope: S) => void): void;
  captureException(e: unknown): void;
}

export function withSentryScope<T, S extends Scope>(
  toucan: ToucanInterface<S>,
  fn: (scope: S) => T
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

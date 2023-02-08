import { Toucan } from "toucan-js";
import { Scope } from "@sentry/core";

export function withSentryScope<T>(toucan: Toucan, fn: (scope: Scope) => T): T {
  let returnValue: T;

  toucan.withScope((scope) => {
    returnValue = fn(scope as any);
  });

  return returnValue!;
}

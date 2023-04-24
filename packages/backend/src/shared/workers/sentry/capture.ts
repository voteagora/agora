import { Toucan } from "toucan-js";

import { StructuredError } from "../../utils/errorUtils";

export function captureException(sentry: Toucan, e: any) {
  if (e instanceof StructuredError) {
    sentry.setExtras({
      ...e.values,
    });
  }

  return sentry.captureException(e);
}

export async function runReportingException<T>(
  sentry: Toucan,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    captureException(sentry, e);
    throw e;
  }
}

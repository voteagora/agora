import { Toucan } from "toucan-js";

import { MakeOptionsResult } from "./makeOptions";
import { runReportingException } from "./capture";

export async function handleFetchWithSentry(
  { options, tags }: MakeOptionsResult,
  request: Request,
  handler: (sentry: Toucan) => Promise<Response>
): Promise<Response> {
  const sentry = new Toucan({
    ...options,
    request: request,
  });

  sentry.setTags({ ...tags, entrypoint: "fetch" });

  return await runReportingException(sentry, async () => {
    return await handler(sentry);
  });
}

export async function handleAlarmWithSentry(
  { options, tags }: MakeOptionsResult,
  handler: (sentry: Toucan) => Promise<void>
): Promise<void> {
  const sentry = new Toucan({
    ...options,
  });

  sentry.setTags({ ...tags, entrypoint: "alarm" });

  return await runReportingException(sentry, async () => {
    return await handler(sentry);
  });
}

export async function handleScheduledWithSentry(
  { options, tags }: MakeOptionsResult,
  event: ScheduledEvent,
  handler: () => Promise<void>
): Promise<void> {
  const sentry = new Toucan({
    ...options,
  });

  sentry.setTags({ ...tags, entrypoint: "scheduled" });

  sentry.setExtras({
    event: {
      scheduledTime: event.scheduledTime,
      cron: event.cron,
    },
  });

  return await runReportingException(sentry, async () => {
    return handler();
  });
}

import Toucan, { Options } from "toucan-js";
import { Env } from "./env";

export function wrapModuleSentry(
  makeOptions: (params: { env: Env; ctx: ExecutionContext }) => Options,
  generateHandlers: (sentry: Toucan) => ExportedHandler<Env>
): ExportedHandler<Env> {
  async function runReportingException<T>(
    sentry: Toucan,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      sentry.captureException(e);
      throw e;
    }
  }

  return {
    async fetch(...args): Promise<Response> {
      const [request, env, ctx] = args;

      request.tracer.addData({
        deployment: env.DEPLOYMENT,
      });

      const sentry = new Toucan({
        ...makeOptions({ env, ctx }),
        request,
      });

      sentry.setTags({
        deployment: env.DEPLOYMENT,
      });

      const handlers = generateHandlers(sentry);

      return await runReportingException(sentry, async () => {
        sentry.setTag("entrypoint", "fetch");
        return handlers.fetch?.(...args);
      });
    },
    async scheduled(...args) {
      const [event, env, ctx] = args;
      const sentry = new Toucan({
        ...makeOptions({ env, ctx }),
      });

      sentry.setTags({
        deployment: env.DEPLOYMENT,
      });

      const handlers = generateHandlers(sentry);

      return await runReportingException(sentry, async () => {
        sentry.setTag("entrypoint", "scheduled");
        sentry.setExtras({
          event: {
            scheduledTime: event.scheduledTime,
            cron: event.cron,
          },
        });
        return handlers.scheduled?.(...args);
      });
    },
  };
}

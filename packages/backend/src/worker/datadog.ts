import { TracerOptions } from "../shared/workers/datadogTracer/tracer";

import { Env } from "./env";

export function makeTracingOptions(
  env: Env,
  hostname: string = ""
): TracerOptions {
  return {
    env: env.ENVIRONMENT,
    apiKey: env.DD_API_KEY,
    hostname,
    service: env.DEPLOYMENT,
  };
}

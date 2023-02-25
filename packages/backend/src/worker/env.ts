import { random } from "lodash";
import { AnalyticsEngineDataset } from "@cloudflare/workers-types";

export interface Env {
  ENVIRONMENT: "prod" | "dev" | "staging";
  PRIMARY_DURABLE_OBJECT_INSTANCE_NAME: string;
  DEPLOYMENT: string;
  SENTRY_DSN: string;
  ALCHEMY_API_KEY: string;
  GITHUB_SHA: string;
  ADMIN_API_KEY: string;

  /**
   * Knobs for tuning stuff.
   */
  BLOCK_STEP_SIZE?: string;
  ALLOW_READS_PERCENTAGE?: string;
  USE_CACHE_PERCENTAGE?: string;

  STORAGE_ANALYTICS: AnalyticsEngineDataset;

  EMAILS: KVNamespace;
  __STATIC_CONTENT: KVNamespace;
  STORAGE_OBJECT: DurableObjectNamespace;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
}

export function safelyLoadBlockStepSize(env: Env): number | undefined {
  return safelyLoadValueFromEnv(env.BLOCK_STEP_SIZE);
}

export function shouldUseCache(env: Env) {
  return shouldAllow(env.USE_CACHE_PERCENTAGE);
}

export function shouldAllowRead(env: Env) {
  return shouldAllow(env.ALLOW_READS_PERCENTAGE);
}

export function mustGetAlchemyApiKey(env: Env) {
  if (!env.ALCHEMY_API_KEY) {
    throw new Error("ALCHEMY_API_KEY missing");
  }

  return env.ALCHEMY_API_KEY;
}

function safelyLoadValueFromEnv(value?: string) {
  if (!value) {
    return;
  }

  try {
    return parseInt(value);
  } catch (e) {
    return undefined;
  }
}

function shouldAllow(value?: string) {
  const minValue = 0;
  const maxValue = 100;

  // 0 <= allowReadsPercentage <= 100
  const allowReadsPercentage = Math.max(
    Math.min(safelyLoadValueFromEnv(value) ?? maxValue, maxValue),
    minValue
  );

  const randomValue = random(minValue, maxValue);

  return randomValue <= allowReadsPercentage;
}

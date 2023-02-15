import {
  AnalyticsEngineDataset,
  DurableObjectNamespace,
  KVNamespace,
} from "@cloudflare/workers-types";

export interface Env {
  ENVIRONMENT: "prod" | "dev" | "staging";
  PRIMARY_DURABLE_OBJECT_INSTANCE_NAME: string;
  DEPLOYMENT: string;
  SENTRY_DSN: string;
  ALCHEMY_API_KEY: string;
  GITHUB_SHA: string;
  ADMIN_API_KEY: string;
  BLOCK_STEP_SIZE?: string;

  STORAGE_ANALYTICS: AnalyticsEngineDataset;

  EMAILS: KVNamespace;
  __STATIC_CONTENT: KVNamespace;
  STORAGE_OBJECT: DurableObjectNamespace;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
}

export function safelyLoadBlockStepSize(env: Env): number | undefined {
  if (!env.BLOCK_STEP_SIZE) {
    return;
  }

  try {
    return parseInt(env.BLOCK_STEP_SIZE);
  } catch (e) {
    return undefined;
  }
}

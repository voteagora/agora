export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  ENVIRONMENT: "prod" | "dev" | "staging";
  DEPLOYMENT: string;
  SENTRY_DSN: string;
  ALCHEMY_API_KEY: string;
  GITHUB_SHA: string;

  STATEMENTS: KVNamespace;
  APPLICATION_CACHE: KVNamespace;
  EMAILS: KVNamespace;
  INDEXER: KVNamespace;
  __STATIC_CONTENT: KVNamespace;

  SNAPSHOT: R2Bucket;

  DISCORD_WEBHOOK_URL: string;
  LAST_BLOCKED_FETCHED: KVNamespace;
}

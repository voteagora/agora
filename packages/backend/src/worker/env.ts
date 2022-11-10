export interface Env {
  ENVIRONMENT: "prod" | "dev" | "staging";
  DEPLOYMENT: string;
  SENTRY_DSN: string;
  ALCHEMY_API_KEY: string;
  GITHUB_SHA: string;

  EMAILS: KVNamespace;
  INDEXER: KVNamespace;
  __STATIC_CONTENT: KVNamespace;

  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
}

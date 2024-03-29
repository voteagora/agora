import { Env } from "../types";
import { requiredValue } from "../utils/requiredValue";

export type MessageContext = {
  adminApiKey: string;
  durableObjectInstanceName: string;
  instanceUrl: string;
};

type AgoraInstanceUrlArgs = {
  deployment: string;
  env: Env;
};

function hostForEnv(env: Env) {
  switch (env) {
    case "prod":
      return "agora-prod.workers.dev";
    case "dev":
      return "agora-dev.workers.dev";
    default:
      throw new Error(`invalid env: ${env}`);
  }
}

function buildAgoraInstanceUrl({ deployment, env }: AgoraInstanceUrlArgs) {
  return `https://${deployment}-agora-${env}.${hostForEnv(env)}/`;
}

export function messageContextFromEnv(deployment: string): MessageContext {
  return {
    adminApiKey: requiredValue(process.env, "AGORA_ADMIN_API_KEY"),
    instanceUrl: buildAgoraInstanceUrl({
      deployment,
      env: requiredValue(process.env, "AGORA_INSTANCE_ENV") as any,
    }),
    durableObjectInstanceName: requiredValue(
      process.env,
      "AGORA_INSTANCE_NAME"
    ),
  };
}

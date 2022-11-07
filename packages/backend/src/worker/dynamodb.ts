import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { Env } from "./env";

export function makeDynamoClient(env: Env) {
  return new DynamoDB({
    // Explicitly specify endpoint to avoid rule evaluation (which uses new Function).
    endpoint: "https://dynamodb.us-east-2.amazonaws.com",
    region: "us-east-2",
    apiVersion: "2012-08-10",
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

import { DynamoDB } from "@aws-sdk/client-dynamodb";

export function makeDynamoClient({
  accessKeyId,
  secretAccessKey,
}: {
  accessKeyId: string;
  secretAccessKey: string;
}) {
  return new DynamoDB({
    // Explicitly specify endpoint to avoid rule evaluation (which uses new Function).
    endpoint: "https://dynamodb.us-east-2.amazonaws.com",
    region: "us-east-2",
    apiVersion: "2012-08-10",
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

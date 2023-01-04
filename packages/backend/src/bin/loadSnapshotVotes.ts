import { S3 } from "@aws-sdk/client-s3";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  spaceId,
  writeVotesToDynamoDb,
} from "../lambdas/loadSnapshotVotes/handler";
import { promises as fs } from "fs";

async function main() {
  const Bucket = process.env.S3_BUCKET!;

  const s3 = new S3({});

  const dynamo = new DynamoDB({
    retryMode: "standard",
  });

  const votes = JSON.parse(
    await fs.readFile("./votes.json", { encoding: "utf-8" })
  );

  const space = JSON.parse(
    await fs.readFile("./space.json", { encoding: "utf-8" })
  );

  const proposals = JSON.parse(
    await fs.readFile("./proposals.json", { encoding: "utf-8" })
  );

  await Promise.all([
    // s3.putObject({
    //   Bucket,
    //   Key: `${spaceId}/votes.json`,
    //   Body: JSON.stringify(votes),
    // }),
    // s3.putObject({
    //   Bucket,
    //   Key: `${spaceId}/space.json`,
    //   Body: JSON.stringify(space),
    // }),
    // s3.putObject({
    //   Bucket,
    //   Key: `${spaceId}/votes.json`,
    //   Body: JSON.stringify(votes),
    // }),
    writeVotesToDynamoDb(dynamo, votes, space, proposals),
  ]);
}

main();

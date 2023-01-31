import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { makeReducers, parseStorage } from "../../snapshot";
import { promises as fs } from "fs";
import { updateSnapshotUpdateStatus } from "../../lambdas/ingestUpdatesFromChain/snapshotUpdateStatus";
import { storeSnapshotInS3 } from "../../lambdas/ingestUpdatesFromChain/storedSnapshot";
import { S3 } from "@aws-sdk/client-s3";

async function main() {
  const dynamoDb = new DynamoDB({
    retryMode: "standard",
  });

  const s3 = new S3({});

  const rawSnapshot = JSON.parse(
    await fs.readFile("snapshot.json", { encoding: "utf-8" })
  );

  const snapshot = parseStorage(rawSnapshot);

  const snapshotLatestBlock = Object.values(rawSnapshot).map(
    (item) => (item as any).block
  )[0];

  for (const reducer of makeReducers()) {
    const initialState = reducer.initialState();
    const currentState = snapshot[reducer.name];

    await reducer.dumpChangesToDynamo?.(dynamoDb, initialState, currentState);
  }

  await updateSnapshotUpdateStatus(snapshotLatestBlock, dynamoDb);

  await storeSnapshotInS3(s3, {
    lastBlockSynced: snapshotLatestBlock,
    contents: Object.fromEntries(
      Object.entries(rawSnapshot).map(([key, value]) => [
        key,
        (value as any).state,
      ])
    ),
  });
}

main();

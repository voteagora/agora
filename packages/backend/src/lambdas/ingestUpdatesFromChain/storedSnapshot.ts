import { NotFound, S3 } from "@aws-sdk/client-s3";

export type StoredSnapshot = {
  lastBlockSynced: number;
  contents: any;
};

const AGORA_DEPLOYMENT = "ens";

export async function fetchSnapshotFromS3(
  s3: S3
): Promise<StoredSnapshot | null> {
  try {
    const snapshot = await s3.getObject({
      Bucket: process.env.S3_BUCKET,
      Key: `${AGORA_DEPLOYMENT}/snapshot.json`,
    });

    if (!snapshot.Body) {
      return null;
    }

    const asString = await snapshot.Body.transformToString();
    if (!asString) {
      return null;
    }

    return JSON.parse(asString);
  } catch (e) {
    if (e instanceof NotFound) {
      return null;
    }

    throw e;
  }
}

export async function storeSnapshotInS3(s3: S3, snapshot: StoredSnapshot) {
  await s3.putObject({
    Bucket: process.env.S3_BUCKET,
    Key: `${AGORA_DEPLOYMENT}/snapshot.json`,
    Body: JSON.stringify(snapshot),
  });
}

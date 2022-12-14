import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { S3 } from "@aws-sdk/client-s3";
import { ethers } from "ethers";
import { acquireLock, releaseLock } from "./lock";
import {
  fetchSnapshotUpdateStatus,
  updateSnapshotUpdateStatus,
} from "./snapshotUpdateStatus";
import {
  fetchSnapshotFromS3,
  StoredSnapshot,
  storeSnapshotInS3,
} from "./storedSnapshot";
import {
  filterForEventHandlers,
  makeReducers,
  tokensReducer,
} from "../../snapshot";
import { getAllLogs } from "../../events";
import SecretsManager from "aws-sdk/clients/secretsmanager";

export async function run() {
  const executionId = uuidv4();

  const secretsManager = new SecretsManager();

  // todo: extract logging library from baseramp and use it here
  console.log("starting", { executionId });

  const alchemyApiKeySecret = await secretsManager
    .getSecretValue({
      SecretId: "mainnet-alchemy-api-key",
    })
    .promise();

  const provider = new ethers.providers.AlchemyProvider(
    "mainnet",
    alchemyApiKeySecret.SecretString
  );

  const dynamo = new DynamoDB({});
  const s3 = new S3({});

  await acquireLock(executionId, dynamo);

  try {
    await update(s3, dynamo, secretsManager, provider);
  } finally {
    await releaseLock(executionId, dynamo);
  }
}

async function update(
  s3: S3,
  dynamo: DynamoDB,
  secretsManager: SecretsManager,
  provider: ethers.providers.Provider
) {
  const storedSnapshot = await fetchSnapshotFromS3(s3);
  const snapshotUpdateStatus = await fetchSnapshotUpdateStatus(dynamo);

  if (
    storedSnapshot?.lastBlockSynced !== snapshotUpdateStatus?.latestBlockSynced
  ) {
    console.error("snapshot version and dynamo snapshot update status drift", {
      storedSnapshot: storedSnapshot?.lastBlockSynced,
      dynamo: snapshotUpdateStatus,
    });
    return;
  }

  const latestBlockNumber = await provider.getBlockNumber();
  const safeBlockMargin = 100;

  const latestSafeBlock = latestBlockNumber - safeBlockMargin;

  const reducers = makeReducers();
  const startingBlock = storedSnapshot
    ? storedSnapshot.lastBlockSynced + 1
    : reducers.reduce(
        (acc, reducer) => Math.min(acc, reducer.startingBlock),
        Infinity
      );

  const snapshots = storedSnapshot?.contents ?? {};

  for (const reducer of reducers) {
    const filter = filterForEventHandlers(
      reducer,
      reducer.eventHandlers.map((handler) => handler.signature)
    );

    let state = (() => {
      const fromSnapshot = snapshots[reducer.name];
      if (fromSnapshot) {
        return reducer.decodeState(fromSnapshot);
      }

      return reducer.initialState();
    })();

    const initialState = reducer.decodeState(reducer.encodeState(state));

    for await (const logs of getAllLogs(
      provider,
      filter,
      startingBlock,
      latestSafeBlock
    )) {
      for (const log of logs) {
        const event = reducer.iface.parseLog(log);
        const eventHandler = reducer.eventHandlers.find(
          (e) => e.signature === event.signature
        )!;

        state = eventHandler.reduce(state, event, log);
      }
    }

    await reducer?.dumpChangesToDynamo?.(dynamo, initialState, state);

    snapshots[reducer.name] = reducer.encodeState(state);
  }

  await updateSnapshotUpdateStatus(latestSafeBlock, dynamo);

  const snapshot: StoredSnapshot = {
    lastBlockSynced: latestSafeBlock,
    contents: snapshots,
  };

  await storeSnapshotInS3(s3, snapshot);

  await storeSnapshotInCloudflareKV(
    transformForCloudflareKv(snapshot),
    secretsManager
  );
}

function transformForCloudflareKv(snapshot: StoredSnapshot) {
  return Object.fromEntries(
    Object.entries(snapshot.contents).map(([key, value]) => {
      const normalizedValue = (() => {
        // if (key === "ENSToken") {
        //   const state = tokensReducer.decodeState(value as any);
        //   state.accounts = new Map(
        //     Array.from(state.accounts.entries()).filter(
        //       ([, value]) => !value.represented.isZero()
        //     )
        //   );

        //   return tokensReducer.encodeState(state);
        // }

        return value;
      })();

      return [key, { state: normalizedValue, block: snapshot.lastBlockSynced }];
    })
  );
}

async function storeSnapshotInCloudflareKV(
  value: any,
  secretsManager: SecretsManager
) {
  const namespace = process.env.CF_KV_NAMESPACE;
  const account = process.env.CF_ACCOUNT;
  const key = "snapshot.json";

  const cloudflareToken = await secretsManager
    .getSecretValue({
      SecretId: "cloudflare-token",
    })
    .promise();

  const response = await fetch(
    new URL(
      `accounts/${account}/storage/kv/namespaces/${namespace}/values/${key}`,
      "https://api.cloudflare.com/client/v4/"
    ),
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${cloudflareToken.SecretString}`,
      },
      body: JSON.stringify({
        metadata: {},
        value: JSON.stringify(value),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`response: ${await response.text()}`);
  }
}

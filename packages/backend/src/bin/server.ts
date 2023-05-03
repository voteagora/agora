import "isomorphic-fetch";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { ValidatedMessage, TransparentMultiCallProvider } from "@agora/common";

import { LevelEntityStore } from "../shared/indexer/storage/entityStore/levelEntityStore";
import { makeLatestBlockFetcher } from "../shared/schema/context/latestBlockFetcher";
import { makeProvider } from "../provider";
import { loggingErrorReporter } from "../shared/schema/helpers/nonFatalErrors";
import { makeContext, nounsDeployment } from "../deployments/nouns";
import { executeServer } from "../shared/indexer/bin/server";
import { pathForDeployment } from "../shared/indexer/paths";

async function main() {
  const provider = makeProvider();
  const deployment = "nouns";
  const dataDirectory = pathForDeployment(deployment);

  await executeServer({
    ...nounsDeployment,

    store: await LevelEntityStore.open(dataDirectory),
    provider,
    contextFactory(reader) {
      const dynamoDb = new DynamoDB({});

      return makeContext(
        {
          provider: new TransparentMultiCallProvider(provider),
          emailStorage: {
            async addEmail(verifiedEmail: ValidatedMessage): Promise<void> {
              console.log({ verifiedEmail });
            },
          },
          statementStorage: {
            async getStatement() {
              return null;
            },
            async addStatement(): Promise<void> {
              return;
            },
          },
          latestBlockFetcher: makeLatestBlockFetcher(provider),
          errorReporter: loggingErrorReporter(),
        },
        reader
      );
    },
  });
}

main();

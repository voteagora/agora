import { executeBin } from "../shared/indexer/bin";
import { LevelEntityStore } from "../shared/indexer/storage/entityStore/levelEntityStore";
import { makeProvider } from "../provider";
import { pathForDeployment } from "../shared/indexer/paths";
import { nounsDeployment } from "../deployments/nouns";

async function main() {
  const deployment = "nouns";
  const dataDirectory = pathForDeployment(deployment);

  await executeBin({
    args: process.argv.slice(2),
    storeFactory: async () => await LevelEntityStore.open(dataDirectory),
    indexers: nounsDeployment.indexers,
    entityDefinitions: nounsDeployment.entityDefinitions,
    providerFactory: () => makeProvider(),
    dataDirectory,
  });
}

main();

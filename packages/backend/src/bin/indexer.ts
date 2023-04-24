import { executeBin } from "../shared/indexer/bin";
import { LevelEntityStore } from "../shared/indexer/storage/entityStore/levelEntityStore";
import { entityDefinitions, indexers } from "../deployments/nouns/indexers";
import { makeProvider } from "../provider";
import { pathForDeployment } from "../shared/indexer/paths";

async function main() {
  const deployment = "nouns";
  const dataDirectory = pathForDeployment(deployment);

  await executeBin({
    args: process.argv.slice(2),
    storeFactory: async () => await LevelEntityStore.open(dataDirectory),
    indexers,
    entityDefinitions,
    providerFactory: () => makeProvider(),
    dataDirectory,
  });
}

main();

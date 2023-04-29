import { createServer } from "@graphql-yoga/node";
import { useApolloTracing } from "@envelop/apollo-tracing";

import { makeReader } from "../storage/reader/reader";
import { followChain, makeInitialStorageArea } from "../process/followChain";
import { timeout } from "../../utils/asyncUtils";
import { EthersBlockProvider } from "../blockProvider/blockProvider";
import { EthersLogProvider } from "../logProvider/logProvider";
import { useErrorInspection } from "../../schema/plugins/useErrorInspection";
import { combineModules, ModuleDefinition } from "../../schema/modules";
import { applyIdPrefix } from "../../schema/transformers/applyIdPrefix";
import { EntityDefinitions } from "../storage/reader/type";
import { ServerArgs } from "../deployments";

export async function executeServer<
  EntityDefinitionsType extends EntityDefinitions,
  ModuleDefinitions extends ReadonlyArray<ModuleDefinition<Record<string, any>>>
>({
  store,
  indexers,
  entityDefinitions,
  provider,
  modules,
  contextFactory,
  finalizationDisabled,
}: ServerArgs<EntityDefinitionsType, ModuleDefinitions>) {
  const blockProvider = new EthersBlockProvider(provider);
  const logProvider = new EthersLogProvider(provider);
  const storageArea = await makeInitialStorageArea(store);

  const iter = followChain(
    store,
    indexers,
    entityDefinitions,
    blockProvider,
    logProvider,
    storageArea,
    !finalizationDisabled
  );

  const _ = (async () => {
    while (true) {
      const value = await iter();
      console.log({ value });
      switch (value.type) {
        case "TIP": {
          await timeout(1000);
        }
      }
    }
  })();

  const schema = applyIdPrefix(combineModules(modules));

  const server = createServer({
    schema,
    async context() {
      const reader = makeReader(store, storageArea, entityDefinitions);
      return contextFactory(reader);
    },
    port: 4001,
    maskedErrors: false,
    plugins: [useApolloTracing(), useErrorInspection()],
  });
  await server.start();
}

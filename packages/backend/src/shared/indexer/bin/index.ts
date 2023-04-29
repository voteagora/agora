import { ethers } from "ethers";

import { IndexerDefinition } from "../process/indexerDefinition";
import { EntityDefinitions } from "../storage/reader/type";
import {
  EntityStore,
  ExportableEntityStore,
  ImportableEntityStore,
} from "../storage/entityStore/entityStore";
import {
  blockIdentifierFromBlock,
  EthersBlockProvider,
} from "../blockProvider/blockProvider";

import { backfill } from "./backfill";
import { dump } from "./dump";
import { fetch } from "./fetch";
import { load } from "./load";
import { tail } from "./tail";

type ExecuteBinArgs = {
  args: string[];
  storeFactory: () => Promise<
    ExportableEntityStore & ImportableEntityStore & EntityStore
  >;
  providerFactory: () => ethers.providers.JsonRpcProvider;
  dataDirectory: string;
  indexers: IndexerDefinition[];
  entityDefinitions: EntityDefinitions;
};

export async function executeBin({
  args,
  dataDirectory,
  indexers,
  entityDefinitions,
  storeFactory,
  providerFactory,
}: ExecuteBinArgs) {
  const [commandArg, ...restArgs] = args;

  switch (commandArg) {
    case "backfill": {
      const lastBlockToIndexArgument = await (async () => {
        const [rawValue] = restArgs;
        if (!rawValue) {
          return null;
        }

        const blockNumber = ethers.BigNumber.from(rawValue).toNumber();

        const provider = providerFactory();
        const blockProvider = new EthersBlockProvider(provider);
        const block = await blockProvider.getBlockByNumber(blockNumber);
        return blockIdentifierFromBlock(block);
      })();

      const store = await storeFactory();

      await backfill(
        store,
        indexers,
        entityDefinitions,
        lastBlockToIndexArgument,
        dataDirectory
      );
      break;
    }

    case "dump": {
      const store = await storeFactory();

      await dump(store, dataDirectory);
      break;
    }

    case "fetch": {
      const [indexerName] = restArgs;
      const provider = providerFactory();
      await fetch({
        indexers,
        indexerName,
        dataDirectory,
        provider,
      });
      break;
    }

    case "load": {
      const store = await storeFactory();
      await load(store, dataDirectory);
      break;
    }

    case "tail": {
      const store = await storeFactory();
      const provider = providerFactory();
      await tail(store, entityDefinitions, indexers, provider);
      break;
    }

    default: {
      throw new Error(`unknown ${commandArg}`);
    }
  }
}

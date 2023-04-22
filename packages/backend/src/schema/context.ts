import { ethers } from "ethers";

import { Reader } from "../indexer/storage/reader";
import { CacheDependencies } from "../utils/cache";

import { entityDefinitions } from "../indexer/contracts/entityDefinitions";

import { EmailStorage, StatementStorage } from "./model";
import { TracingContext } from "./transformers/tracingContext";
import { LatestBlockFetcher } from "./latestBlockFetcher";

export type AgoraContextType = {
  reader: Reader<typeof entityDefinitions>;
  ethProvider: ethers.providers.BaseProvider;
  provider: ethers.providers.BaseProvider;
  tracingContext: TracingContext;
  statementStorage: StatementStorage;
  cache: CacheDependencies;
  emailStorage: EmailStorage;
  latestBlockFetcher: LatestBlockFetcher;
};

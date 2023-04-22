import { ethers } from "ethers";

import { entityDefinitions } from "../indexer/contracts/entityDefinitions";
import { Reader } from "../indexer/storage/reader";
import { CacheDependencies } from "../utils/cache";

import { LatestBlockFetcher } from "./latestBlockFetcher";
import { EmailStorage, StatementStorage } from "./model";
import { TracingContext } from "./transformers/tracingContext";

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

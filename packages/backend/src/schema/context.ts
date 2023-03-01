import { Reader } from "../indexer/storage/reader";
import { CacheDependencies } from "../utils/cache";
import { EmailStorage, StatementStorage } from "./model";
import { ethers } from "ethers";
import { TracingContext } from "./transformers/tracingContext";
import { LatestBlockFetcher } from "./latestBlockFetcher";
import { entityDefinitions } from "../indexer/contracts/entityDefinitions";

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

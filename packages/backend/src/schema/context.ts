import { Reader } from "../indexer/storage/reader";
import { entityDefinitions } from "../indexer/contracts";
import { CacheDependencies } from "../utils/cache";
import { EmailStorage, StatementStorage } from "./model";
import { ethers } from "ethers";
import { TracingContext } from "./transformers/tracingContext";
import { SnapshotVoteModel } from "./resolvers/snapshot";
import { LatestBlockFetcher } from "./latestBlockFetcher";

export type AgoraContextType = {
  reader: Reader<typeof entityDefinitions>;
  ethProvider: ethers.providers.BaseProvider;
  provider: ethers.providers.BaseProvider;
  snapshotVoteStorage: SnapshotVoteStorage;
  tracingContext: TracingContext;
  statementStorage: StatementStorage;
  cache: CacheDependencies;
  emailStorage: EmailStorage;
  latestBlockFetcher: LatestBlockFetcher;
};

export type SnapshotVoteStorage = {
  getSnapshotVotesByVoter(address: string): Promise<SnapshotVoteModel[]>;
};

import { Reader } from "../indexer/storage/reader";
import { entityDefinitions } from "../indexer/contracts";
import { CacheDependencies } from "../utils/cache";
import { EmailStorage, StatementStorage } from "./model";
import { ethers } from "ethers";
import { TracingContext } from "./transformers/tracingContext";
import { SnapshotVoteModel } from "./resolvers/snapshot";
import { LatestBlockFetcher } from "./latestBlockFetcher";
import { LikesStore } from "../services/likes";
import { BallotsStore } from "../services/ballot";

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
  likesStore: LikesStore;
  ballotsStore: BallotsStore;
};

export type SnapshotVoteStorage = {
  getSnapshotVotesByVoter(address: string): Promise<SnapshotVoteModel[]>;
};

import { Reader } from "../indexer/storage/reader";
import { entityDefinitions } from "../indexer/contracts";
import { CacheDependencies } from "../utils/cache";
import { EmailStorage, StatementStorage } from "./model";
import { ethers } from "ethers";
import { TracingContext } from "./transformers/tracingContext";
import { SnapshotVoteModel } from "./resolvers/snapshot";
import { DelegateStorage } from "../model";

export type AgoraContextType = {
  reader: Reader<typeof entityDefinitions>;
  ethProvider: ethers.providers.BaseProvider;
  provider: ethers.providers.BaseProvider;
  snapshotVoteStorage: SnapshotVoteStorage;
  tracingContext: TracingContext;
  statementStorage: StatementStorage;
  delegateStorage: DelegateStorage;
  cache: CacheDependencies;
  emailStorage: EmailStorage;
};

export type SnapshotVoteStorage = {
  getSnapshotVotesByVoter(address: string): Promise<SnapshotVoteModel[]>;
};

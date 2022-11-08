import { ethers } from "ethers";
import { z } from "zod";
import { formSchema } from "./formSchema";
import { ValidatedMessage } from "./utils/signing";
import { CacheDependencies, Span } from "./utils/cache";
import { ENSAccount, Snapshot } from "./snapshot";
import { getSnapshotVotes } from "./bin/server";

export type Address = {
  address: string;
};

export type ResolvedName = {
  address: string;
};

export type WrappedDelegate = DelegateOverview;

export type DelegateStatement = {
  address: string;
  values: z.TypeOf<typeof formSchema>;
};

export type StoredStatement = {
  address: string;
  signature: string;
  signedPayload: string;
  signatureType?: "EOA" | "CONTRACT";
  updatedAt: number;
};

export interface StatementStorage {
  addStatement(statement: StoredStatement): Promise<void>;
  getStatement(address: string): Promise<StoredStatement | null>;
}

export interface EmailStorage {
  addEmail(verifiedEmail: ValidatedMessage): Promise<void>;
}

type SpanMap = {
  get(key: string): Span | undefined;
  set(key: string, span: Span): void;
};

export function makeNopSpanMap() {
  return {
    get(key: string): Span | undefined {
      return undefined;
    },

    set(key: string, span: Span) {},
  };
}

export type TracingContext = {
  spanMap: SpanMap;
  rootSpan: Span;
};

export type PageInfo = (
  | {
      hasPreviousPage: false;
      startCursor: undefined;
    }
  | {
      hasPreviousPage: true;
      startCursor: string;
    }
) &
  (
    | {
        hasNextPage: false;
        endCursor: undefined;
      }
    | {
        hasNextPage: true;
        endCursor: string;
      }
  );

export type Connection<T> = {
  edges: Edge<T>[];
  pageInfo: PageInfo;
};

export type Edge<T> = {
  node: T;
  cursor: string;
};

export type DelegateOverview = {
  address: string;
  resolvedName?: string | null;

  tokensOwned: ethers.BigNumber;
  tokensRepresented: ethers.BigNumber;
  tokenHoldersRepresented: number;
  statement: StoredStatement;
};

export type DelegatesPage = Connection<DelegateOverview>;

export type GetDelegatesParams = {
  where?: "withStatement" | "withoutStatement";
  orderBy: "mostVotingPower" | "mostRelevant" | "mostDelegates" | "mostActive";
  first: number;
  after?: string;
};

export type DelegateDetail = {
  address: string;
};

export type DelegateStorage = {
  getDelegate(address: string): Promise<DelegateOverview>;
  getDelegates(params: GetDelegatesParams): Promise<DelegatesPage>;
};

export type AgoraContextType = {
  provider: ethers.providers.BaseProvider;
  delegateStorage: DelegateStorage;
  snapshot: Snapshot;
  snapshotVotes: Awaited<ReturnType<typeof getSnapshotVotes>>;
  tracingContext: TracingContext;
  statementStorage: StatementStorage;
  cache: CacheDependencies;
  emailStorage: EmailStorage;
};

export type Account = ENSAccount & {
  address: string;
};

export { Proposal, Vote } from "./snapshot";

export type VotingPower = ethers.BigNumber;

export type Transaction = {
  transactionHash: string;
  blockHash: string;
};

export type Block = ethers.providers.Block;

export type Metrics = {};

export type SnapshotVote = AgoraContextType["snapshotVotes"]["votes"][0];
export type SnapshotProposal =
  AgoraContextType["snapshotVotes"]["proposals"][0];

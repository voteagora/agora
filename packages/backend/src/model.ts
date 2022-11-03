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

export type WrappedDelegate = {
  address: string;

  delegateStatementExists: boolean;
  underlyingDelegate?: Account;
};

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
  listStatements(): Promise<string[]>;
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

export type AgoraContextType = {
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

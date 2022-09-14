import { Executor } from "@graphql-tools/utils";
import type { Span } from "@cloudflare/workers-honeycomb-logger";
import { z } from "zod";
import { formSchema } from "./formSchema";
import { ValidatedMessage } from "./utils/signing";
import { CacheDependencies } from "./utils/cache";

export type OverallMetrics = {};

export type Address = {
  address: string;
};

export type ResolvedName = {
  address: string;
};

export type WrappedDelegate = {
  address: string;

  delegateStatementExists: boolean;
  underlyingDelegate?: any;
};

export type DelegateStatement = {
  address: string;
  values: z.TypeOf<typeof formSchema>;
};

export type StoredStatement = {
  address: string;
  signature: string;
  signedPayload: string;
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

export type AgoraContextType = {
  statementStorage: StatementStorage;
  cache: CacheDependencies;
  emailStorage: EmailStorage;
  nounsExecutor: Executor;
};

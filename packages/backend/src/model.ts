import { validateForm } from "./formSchema";

export type OverallMetrics = {};

export type Address = {
  address: string;
};

export type ResolvedName = {
  address: string;
};

export type WrappedDelegate = {
  address: string;

  underlyingDelegate?: any;
};

export type DelegateStatement = ReturnType<typeof validateForm>;

export type StoredStatement = {
  address: string;
  signature: string;
  signedPayload: string;
};

export interface StatementStorage {
  addStatement(statement: StoredStatement): Promise<void>;
  getStatement(address: string): Promise<StoredStatement | null>;
  listStatements(): Promise<string[]>;
}

export type AgoraContextType = {
  statementStorage: StatementStorage;
};

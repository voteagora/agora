import { ValidatedMessage } from "../utils/signing";

export type StoredStatement = {
  address: string;
  signature: string;
  signedPayload: string;
  signatureType?: "EOA" | "CONTRACT";
  updatedAt: number;
  createdAt?: number;
};

export interface StatementStorage {
  addStatement(statement: StoredStatement): Promise<void>;
  getStatement(address: string): Promise<StoredStatement | null>;
}

export interface EmailStorage {
  addEmail(verifiedEmail: ValidatedMessage): Promise<void>;
}

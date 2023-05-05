import { ValidatedMessage } from "../utils/signing";
import { ethers } from "ethers";
import { Connection } from "./pagination";

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

export type GetDelegatesParams = {
  where?: "withStatement" | "withoutStatement";
  orderBy:
    | "mostVotingPower"
    | "mostDelegates"
    | "mostVotes"
    | "mostVotesMostPower";
  first: number;
  after?: string;
};

export type DelegateOverview = {
  address: string;
  resolvedName?: string | null;

  tokensOwned: ethers.BigNumber;
  tokensRepresented: ethers.BigNumber;
  tokenHoldersRepresented: number;
  statement: StoredStatement | null;
};

export type Delegate = DelegateOverview;

export type DelegatesPage = Connection<DelegateOverview>;

export type DelegateStorage = {
  getDelegate(address: string): Promise<DelegateOverview>;
  getDelegates(params: GetDelegatesParams): Promise<DelegatesPage>;
};

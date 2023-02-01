import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { OverallMetrics as OverallMetricsModel, Address as AddressModel, ResolvedName as ResolvedNameModel, WrappedDelegate as WrappedDelegateModel, DelegateStatement as DelegateStatementModel, LiquidDelegationLot as LiquidDelegationLotModel, LiquidDelegationRules as LiquidDelegationRulesModel, LiquidDelegationRepresentation as LiquidDelegationRepresentationModel, AgoraContextType } from '../model';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  BigDecimal: any;
  BigInt: any;
  Bytes: any;
};

export type Account = {
  __typename?: 'Account';
  address: Address;
  /**
   * Delegate address of the token holder which will participate in votings.
   * Delegates don't need to hold any tokens and can even be the token holder itself.
   */
  delegate?: Maybe<Delegate>;
  /** An Account is any address that holds any amount of Nouns, the id used is the blockchain address. */
  id: Scalars['ID'];
  /** The Nouns owned by this account */
  nouns: Array<Noun>;
  /** Noun balance of this address expressed as a BigInt normalized value for the Nouns ERC721 Token */
  tokenBalance: Scalars['BigInt'];
  /** Noun balance of this address expressed in the smallest unit of the Nouns ERC721 Token */
  tokenBalanceRaw: Scalars['BigInt'];
  /** Total amount of Nouns ever held by this address expressed as a BigInt normalized value for the Nouns ERC721 Token */
  totalTokensHeld: Scalars['BigInt'];
  /** Total amount of Nouns ever held by this address expressed in the smallest unit of the Nouns ERC721 Token */
  totalTokensHeldRaw: Scalars['BigInt'];
};


export type AccountNounsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Noun_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Noun_Filter>;
};

export type Account_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  delegate?: InputMaybe<Scalars['String']>;
  delegate_?: InputMaybe<Delegate_Filter>;
  delegate_contains?: InputMaybe<Scalars['String']>;
  delegate_contains_nocase?: InputMaybe<Scalars['String']>;
  delegate_ends_with?: InputMaybe<Scalars['String']>;
  delegate_ends_with_nocase?: InputMaybe<Scalars['String']>;
  delegate_gt?: InputMaybe<Scalars['String']>;
  delegate_gte?: InputMaybe<Scalars['String']>;
  delegate_in?: InputMaybe<Array<Scalars['String']>>;
  delegate_lt?: InputMaybe<Scalars['String']>;
  delegate_lte?: InputMaybe<Scalars['String']>;
  delegate_not?: InputMaybe<Scalars['String']>;
  delegate_not_contains?: InputMaybe<Scalars['String']>;
  delegate_not_contains_nocase?: InputMaybe<Scalars['String']>;
  delegate_not_ends_with?: InputMaybe<Scalars['String']>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  delegate_not_in?: InputMaybe<Array<Scalars['String']>>;
  delegate_not_starts_with?: InputMaybe<Scalars['String']>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  delegate_starts_with?: InputMaybe<Scalars['String']>;
  delegate_starts_with_nocase?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  nouns?: InputMaybe<Array<Scalars['String']>>;
  nouns_?: InputMaybe<Noun_Filter>;
  nouns_contains?: InputMaybe<Array<Scalars['String']>>;
  nouns_contains_nocase?: InputMaybe<Array<Scalars['String']>>;
  nouns_not?: InputMaybe<Array<Scalars['String']>>;
  nouns_not_contains?: InputMaybe<Array<Scalars['String']>>;
  nouns_not_contains_nocase?: InputMaybe<Array<Scalars['String']>>;
  tokenBalance?: InputMaybe<Scalars['BigInt']>;
  tokenBalanceRaw?: InputMaybe<Scalars['BigInt']>;
  tokenBalanceRaw_gt?: InputMaybe<Scalars['BigInt']>;
  tokenBalanceRaw_gte?: InputMaybe<Scalars['BigInt']>;
  tokenBalanceRaw_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tokenBalanceRaw_lt?: InputMaybe<Scalars['BigInt']>;
  tokenBalanceRaw_lte?: InputMaybe<Scalars['BigInt']>;
  tokenBalanceRaw_not?: InputMaybe<Scalars['BigInt']>;
  tokenBalanceRaw_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tokenBalance_gt?: InputMaybe<Scalars['BigInt']>;
  tokenBalance_gte?: InputMaybe<Scalars['BigInt']>;
  tokenBalance_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tokenBalance_lt?: InputMaybe<Scalars['BigInt']>;
  tokenBalance_lte?: InputMaybe<Scalars['BigInt']>;
  tokenBalance_not?: InputMaybe<Scalars['BigInt']>;
  tokenBalance_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  totalTokensHeld?: InputMaybe<Scalars['BigInt']>;
  totalTokensHeldRaw?: InputMaybe<Scalars['BigInt']>;
  totalTokensHeldRaw_gt?: InputMaybe<Scalars['BigInt']>;
  totalTokensHeldRaw_gte?: InputMaybe<Scalars['BigInt']>;
  totalTokensHeldRaw_in?: InputMaybe<Array<Scalars['BigInt']>>;
  totalTokensHeldRaw_lt?: InputMaybe<Scalars['BigInt']>;
  totalTokensHeldRaw_lte?: InputMaybe<Scalars['BigInt']>;
  totalTokensHeldRaw_not?: InputMaybe<Scalars['BigInt']>;
  totalTokensHeldRaw_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  totalTokensHeld_gt?: InputMaybe<Scalars['BigInt']>;
  totalTokensHeld_gte?: InputMaybe<Scalars['BigInt']>;
  totalTokensHeld_in?: InputMaybe<Array<Scalars['BigInt']>>;
  totalTokensHeld_lt?: InputMaybe<Scalars['BigInt']>;
  totalTokensHeld_lte?: InputMaybe<Scalars['BigInt']>;
  totalTokensHeld_not?: InputMaybe<Scalars['BigInt']>;
  totalTokensHeld_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum Account_OrderBy {
  Delegate = 'delegate',
  Id = 'id',
  Nouns = 'nouns',
  TokenBalance = 'tokenBalance',
  TokenBalanceRaw = 'tokenBalanceRaw',
  TotalTokensHeld = 'totalTokensHeld',
  TotalTokensHeldRaw = 'totalTokensHeldRaw'
}

export enum ActualProposalStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Defeated = 'DEFEATED',
  Executed = 'EXECUTED',
  Expired = 'EXPIRED',
  Pending = 'PENDING',
  Queued = 'QUEUED',
  Vetoed = 'VETOED'
}

export type Address = {
  __typename?: 'Address';
  account?: Maybe<Account>;
  isContract: Scalars['Boolean'];
  resolvedName: ResolvedName;
  wrappedDelegate: WrappedDelegate;
};

export type Auction = {
  __typename?: 'Auction';
  /** The current highest bid amount */
  amount: Scalars['BigInt'];
  /** The account with the current highest bid */
  bidder?: Maybe<Account>;
  /** The auction bids */
  bids: Array<Bid>;
  /** The time that the auction is scheduled to end */
  endTime: Scalars['BigInt'];
  /** The Noun's ERC721 token id */
  id: Scalars['ID'];
  /** The Noun */
  noun: Noun;
  /** Whether or not the auction has been settled */
  settled: Scalars['Boolean'];
  /** The time that the auction started */
  startTime: Scalars['BigInt'];
};


export type AuctionBidsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Bid_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Bid_Filter>;
};

export type Auction_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']>;
  amount_gt?: InputMaybe<Scalars['BigInt']>;
  amount_gte?: InputMaybe<Scalars['BigInt']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']>;
  amount_lte?: InputMaybe<Scalars['BigInt']>;
  amount_not?: InputMaybe<Scalars['BigInt']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  bidder?: InputMaybe<Scalars['String']>;
  bidder_?: InputMaybe<Account_Filter>;
  bidder_contains?: InputMaybe<Scalars['String']>;
  bidder_contains_nocase?: InputMaybe<Scalars['String']>;
  bidder_ends_with?: InputMaybe<Scalars['String']>;
  bidder_ends_with_nocase?: InputMaybe<Scalars['String']>;
  bidder_gt?: InputMaybe<Scalars['String']>;
  bidder_gte?: InputMaybe<Scalars['String']>;
  bidder_in?: InputMaybe<Array<Scalars['String']>>;
  bidder_lt?: InputMaybe<Scalars['String']>;
  bidder_lte?: InputMaybe<Scalars['String']>;
  bidder_not?: InputMaybe<Scalars['String']>;
  bidder_not_contains?: InputMaybe<Scalars['String']>;
  bidder_not_contains_nocase?: InputMaybe<Scalars['String']>;
  bidder_not_ends_with?: InputMaybe<Scalars['String']>;
  bidder_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  bidder_not_in?: InputMaybe<Array<Scalars['String']>>;
  bidder_not_starts_with?: InputMaybe<Scalars['String']>;
  bidder_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  bidder_starts_with?: InputMaybe<Scalars['String']>;
  bidder_starts_with_nocase?: InputMaybe<Scalars['String']>;
  bids_?: InputMaybe<Bid_Filter>;
  endTime?: InputMaybe<Scalars['BigInt']>;
  endTime_gt?: InputMaybe<Scalars['BigInt']>;
  endTime_gte?: InputMaybe<Scalars['BigInt']>;
  endTime_in?: InputMaybe<Array<Scalars['BigInt']>>;
  endTime_lt?: InputMaybe<Scalars['BigInt']>;
  endTime_lte?: InputMaybe<Scalars['BigInt']>;
  endTime_not?: InputMaybe<Scalars['BigInt']>;
  endTime_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  noun?: InputMaybe<Scalars['String']>;
  noun_?: InputMaybe<Noun_Filter>;
  noun_contains?: InputMaybe<Scalars['String']>;
  noun_contains_nocase?: InputMaybe<Scalars['String']>;
  noun_ends_with?: InputMaybe<Scalars['String']>;
  noun_ends_with_nocase?: InputMaybe<Scalars['String']>;
  noun_gt?: InputMaybe<Scalars['String']>;
  noun_gte?: InputMaybe<Scalars['String']>;
  noun_in?: InputMaybe<Array<Scalars['String']>>;
  noun_lt?: InputMaybe<Scalars['String']>;
  noun_lte?: InputMaybe<Scalars['String']>;
  noun_not?: InputMaybe<Scalars['String']>;
  noun_not_contains?: InputMaybe<Scalars['String']>;
  noun_not_contains_nocase?: InputMaybe<Scalars['String']>;
  noun_not_ends_with?: InputMaybe<Scalars['String']>;
  noun_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  noun_not_in?: InputMaybe<Array<Scalars['String']>>;
  noun_not_starts_with?: InputMaybe<Scalars['String']>;
  noun_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  noun_starts_with?: InputMaybe<Scalars['String']>;
  noun_starts_with_nocase?: InputMaybe<Scalars['String']>;
  settled?: InputMaybe<Scalars['Boolean']>;
  settled_in?: InputMaybe<Array<Scalars['Boolean']>>;
  settled_not?: InputMaybe<Scalars['Boolean']>;
  settled_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
  startTime?: InputMaybe<Scalars['BigInt']>;
  startTime_gt?: InputMaybe<Scalars['BigInt']>;
  startTime_gte?: InputMaybe<Scalars['BigInt']>;
  startTime_in?: InputMaybe<Array<Scalars['BigInt']>>;
  startTime_lt?: InputMaybe<Scalars['BigInt']>;
  startTime_lte?: InputMaybe<Scalars['BigInt']>;
  startTime_not?: InputMaybe<Scalars['BigInt']>;
  startTime_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum Auction_OrderBy {
  Amount = 'amount',
  Bidder = 'bidder',
  Bids = 'bids',
  EndTime = 'endTime',
  Id = 'id',
  Noun = 'noun',
  Settled = 'settled',
  StartTime = 'startTime'
}

export type Bid = {
  __typename?: 'Bid';
  /** Bid amount */
  amount: Scalars['BigInt'];
  /** The auction being bid in */
  auction: Auction;
  /** Bidder account */
  bidder?: Maybe<Account>;
  /** Block number of the bid */
  blockNumber: Scalars['BigInt'];
  /** The timestamp of the block the bid is in */
  blockTimestamp: Scalars['BigInt'];
  /** Bid transaction hash */
  id: Scalars['ID'];
  /** The Noun being bid on */
  noun: Noun;
  /** Index of transaction within block */
  txIndex: Scalars['BigInt'];
};

export type Bid_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']>;
  amount_gt?: InputMaybe<Scalars['BigInt']>;
  amount_gte?: InputMaybe<Scalars['BigInt']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']>;
  amount_lte?: InputMaybe<Scalars['BigInt']>;
  amount_not?: InputMaybe<Scalars['BigInt']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  auction?: InputMaybe<Scalars['String']>;
  auction_?: InputMaybe<Auction_Filter>;
  auction_contains?: InputMaybe<Scalars['String']>;
  auction_contains_nocase?: InputMaybe<Scalars['String']>;
  auction_ends_with?: InputMaybe<Scalars['String']>;
  auction_ends_with_nocase?: InputMaybe<Scalars['String']>;
  auction_gt?: InputMaybe<Scalars['String']>;
  auction_gte?: InputMaybe<Scalars['String']>;
  auction_in?: InputMaybe<Array<Scalars['String']>>;
  auction_lt?: InputMaybe<Scalars['String']>;
  auction_lte?: InputMaybe<Scalars['String']>;
  auction_not?: InputMaybe<Scalars['String']>;
  auction_not_contains?: InputMaybe<Scalars['String']>;
  auction_not_contains_nocase?: InputMaybe<Scalars['String']>;
  auction_not_ends_with?: InputMaybe<Scalars['String']>;
  auction_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  auction_not_in?: InputMaybe<Array<Scalars['String']>>;
  auction_not_starts_with?: InputMaybe<Scalars['String']>;
  auction_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  auction_starts_with?: InputMaybe<Scalars['String']>;
  auction_starts_with_nocase?: InputMaybe<Scalars['String']>;
  bidder?: InputMaybe<Scalars['String']>;
  bidder_?: InputMaybe<Account_Filter>;
  bidder_contains?: InputMaybe<Scalars['String']>;
  bidder_contains_nocase?: InputMaybe<Scalars['String']>;
  bidder_ends_with?: InputMaybe<Scalars['String']>;
  bidder_ends_with_nocase?: InputMaybe<Scalars['String']>;
  bidder_gt?: InputMaybe<Scalars['String']>;
  bidder_gte?: InputMaybe<Scalars['String']>;
  bidder_in?: InputMaybe<Array<Scalars['String']>>;
  bidder_lt?: InputMaybe<Scalars['String']>;
  bidder_lte?: InputMaybe<Scalars['String']>;
  bidder_not?: InputMaybe<Scalars['String']>;
  bidder_not_contains?: InputMaybe<Scalars['String']>;
  bidder_not_contains_nocase?: InputMaybe<Scalars['String']>;
  bidder_not_ends_with?: InputMaybe<Scalars['String']>;
  bidder_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  bidder_not_in?: InputMaybe<Array<Scalars['String']>>;
  bidder_not_starts_with?: InputMaybe<Scalars['String']>;
  bidder_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  bidder_starts_with?: InputMaybe<Scalars['String']>;
  bidder_starts_with_nocase?: InputMaybe<Scalars['String']>;
  blockNumber?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  noun?: InputMaybe<Scalars['String']>;
  noun_?: InputMaybe<Noun_Filter>;
  noun_contains?: InputMaybe<Scalars['String']>;
  noun_contains_nocase?: InputMaybe<Scalars['String']>;
  noun_ends_with?: InputMaybe<Scalars['String']>;
  noun_ends_with_nocase?: InputMaybe<Scalars['String']>;
  noun_gt?: InputMaybe<Scalars['String']>;
  noun_gte?: InputMaybe<Scalars['String']>;
  noun_in?: InputMaybe<Array<Scalars['String']>>;
  noun_lt?: InputMaybe<Scalars['String']>;
  noun_lte?: InputMaybe<Scalars['String']>;
  noun_not?: InputMaybe<Scalars['String']>;
  noun_not_contains?: InputMaybe<Scalars['String']>;
  noun_not_contains_nocase?: InputMaybe<Scalars['String']>;
  noun_not_ends_with?: InputMaybe<Scalars['String']>;
  noun_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  noun_not_in?: InputMaybe<Array<Scalars['String']>>;
  noun_not_starts_with?: InputMaybe<Scalars['String']>;
  noun_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  noun_starts_with?: InputMaybe<Scalars['String']>;
  noun_starts_with_nocase?: InputMaybe<Scalars['String']>;
  txIndex?: InputMaybe<Scalars['BigInt']>;
  txIndex_gt?: InputMaybe<Scalars['BigInt']>;
  txIndex_gte?: InputMaybe<Scalars['BigInt']>;
  txIndex_in?: InputMaybe<Array<Scalars['BigInt']>>;
  txIndex_lt?: InputMaybe<Scalars['BigInt']>;
  txIndex_lte?: InputMaybe<Scalars['BigInt']>;
  txIndex_not?: InputMaybe<Scalars['BigInt']>;
  txIndex_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum Bid_OrderBy {
  Amount = 'amount',
  Auction = 'auction',
  Bidder = 'bidder',
  BlockNumber = 'blockNumber',
  BlockTimestamp = 'blockTimestamp',
  Id = 'id',
  Noun = 'noun',
  TxIndex = 'txIndex'
}

export type BlockChangedFilter = {
  number_gte: Scalars['Int'];
};

export type Block_Height = {
  hash?: InputMaybe<Scalars['Bytes']>;
  number?: InputMaybe<Scalars['Int']>;
  number_gte?: InputMaybe<Scalars['Int']>;
};

export type CreateNewDelegateStatementData = {
  email?: InputMaybe<ValueWithSignature>;
  statement: ValueWithSignature;
};

export type Delegate = {
  __typename?: 'Delegate';
  address: Address;
  /**
   * Amount of votes delegated to this delegate to be used on proposal votings
   * expressed as a BigInt normalized value for the Nouns ERC721 Token
   */
  delegatedVotes: Scalars['BigInt'];
  /**
   * Amount of votes delegated to this delegate to be used on proposal votings
   * expressed in the smallest unit of the Nouns ERC721 Token
   */
  delegatedVotesRaw: Scalars['BigInt'];
  /**
   * A Delegate is any address that has been delegated with voting tokens by a
   * token holder, id is the blockchain address of said delegate
   */
  id: Scalars['ID'];
  liquidRepresentation: Array<LiquidDelegationRepresentation>;
  /** Nouns that this delegate represents */
  nounsRepresented: Array<Noun>;
  propHouseVotes: Array<PropHouseRoundVotes>;
  /** Proposals that the delegate has created */
  proposals: Array<Proposal>;
  resolvedName: ResolvedName;
  /** Token holders that this delegate represents */
  tokenHoldersRepresented: Array<Account>;
  tokenHoldersRepresentedAmount: Scalars['Int'];
  voteSummary: DelegateVotesSummary;
  /** Votes that a delegate has made in different proposals */
  votes: Array<Vote>;
};


export type DelegateNounsRepresentedArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Noun_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Noun_Filter>;
};


export type DelegateProposalsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Proposal_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Proposal_Filter>;
};


export type DelegateTokenHoldersRepresentedArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Account_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Account_Filter>;
};


export type DelegateVotesArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Vote_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Vote_Filter>;
};

export type DelegateStatement = {
  __typename?: 'DelegateStatement';
  discord: Scalars['String'];
  leastValuableProposals: Array<Proposal>;
  mostValuableProposals: Array<Proposal>;
  openToSponsoringProposals?: Maybe<Scalars['Boolean']>;
  statement: Scalars['String'];
  summary?: Maybe<Scalars['String']>;
  topIssues: Array<TopIssue>;
  twitter: Scalars['String'];
};

export type DelegateVotesSummary = {
  __typename?: 'DelegateVotesSummary';
  abstainVotes: Scalars['Int'];
  againstVotes: Scalars['Int'];
  forVotes: Scalars['Int'];
  totalVotes: Scalars['Int'];
};

export type Delegate_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  delegatedVotes?: InputMaybe<Scalars['BigInt']>;
  delegatedVotesRaw?: InputMaybe<Scalars['BigInt']>;
  delegatedVotesRaw_gt?: InputMaybe<Scalars['BigInt']>;
  delegatedVotesRaw_gte?: InputMaybe<Scalars['BigInt']>;
  delegatedVotesRaw_in?: InputMaybe<Array<Scalars['BigInt']>>;
  delegatedVotesRaw_lt?: InputMaybe<Scalars['BigInt']>;
  delegatedVotesRaw_lte?: InputMaybe<Scalars['BigInt']>;
  delegatedVotesRaw_not?: InputMaybe<Scalars['BigInt']>;
  delegatedVotesRaw_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  delegatedVotes_gt?: InputMaybe<Scalars['BigInt']>;
  delegatedVotes_gte?: InputMaybe<Scalars['BigInt']>;
  delegatedVotes_in?: InputMaybe<Array<Scalars['BigInt']>>;
  delegatedVotes_lt?: InputMaybe<Scalars['BigInt']>;
  delegatedVotes_lte?: InputMaybe<Scalars['BigInt']>;
  delegatedVotes_not?: InputMaybe<Scalars['BigInt']>;
  delegatedVotes_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  nounsRepresented?: InputMaybe<Array<Scalars['String']>>;
  nounsRepresented_?: InputMaybe<Noun_Filter>;
  nounsRepresented_contains?: InputMaybe<Array<Scalars['String']>>;
  nounsRepresented_contains_nocase?: InputMaybe<Array<Scalars['String']>>;
  nounsRepresented_not?: InputMaybe<Array<Scalars['String']>>;
  nounsRepresented_not_contains?: InputMaybe<Array<Scalars['String']>>;
  nounsRepresented_not_contains_nocase?: InputMaybe<Array<Scalars['String']>>;
  proposals_?: InputMaybe<Proposal_Filter>;
  tokenHoldersRepresentedAmount?: InputMaybe<Scalars['Int']>;
  tokenHoldersRepresentedAmount_gt?: InputMaybe<Scalars['Int']>;
  tokenHoldersRepresentedAmount_gte?: InputMaybe<Scalars['Int']>;
  tokenHoldersRepresentedAmount_in?: InputMaybe<Array<Scalars['Int']>>;
  tokenHoldersRepresentedAmount_lt?: InputMaybe<Scalars['Int']>;
  tokenHoldersRepresentedAmount_lte?: InputMaybe<Scalars['Int']>;
  tokenHoldersRepresentedAmount_not?: InputMaybe<Scalars['Int']>;
  tokenHoldersRepresentedAmount_not_in?: InputMaybe<Array<Scalars['Int']>>;
  tokenHoldersRepresented_?: InputMaybe<Account_Filter>;
  votes_?: InputMaybe<Vote_Filter>;
};

export enum Delegate_OrderBy {
  DelegatedVotes = 'delegatedVotes',
  DelegatedVotesRaw = 'delegatedVotesRaw',
  Id = 'id',
  NounsRepresented = 'nounsRepresented',
  Proposals = 'proposals',
  TokenHoldersRepresented = 'tokenHoldersRepresented',
  TokenHoldersRepresentedAmount = 'tokenHoldersRepresentedAmount',
  Votes = 'votes'
}

export type DelegationEvent = {
  __typename?: 'DelegationEvent';
  /** Block number of the event */
  blockNumber: Scalars['BigInt'];
  /** The timestamp of the block the event is in */
  blockTimestamp: Scalars['BigInt'];
  /** The txn hash of this event + nounId */
  id: Scalars['ID'];
  /** New delegate address */
  newDelegate: Delegate;
  /** The Noun being delegated */
  noun: Noun;
  /** Previous delegate address */
  previousDelegate: Delegate;
};

export type DelegationEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  blockNumber?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  newDelegate?: InputMaybe<Scalars['String']>;
  newDelegate_?: InputMaybe<Delegate_Filter>;
  newDelegate_contains?: InputMaybe<Scalars['String']>;
  newDelegate_contains_nocase?: InputMaybe<Scalars['String']>;
  newDelegate_ends_with?: InputMaybe<Scalars['String']>;
  newDelegate_ends_with_nocase?: InputMaybe<Scalars['String']>;
  newDelegate_gt?: InputMaybe<Scalars['String']>;
  newDelegate_gte?: InputMaybe<Scalars['String']>;
  newDelegate_in?: InputMaybe<Array<Scalars['String']>>;
  newDelegate_lt?: InputMaybe<Scalars['String']>;
  newDelegate_lte?: InputMaybe<Scalars['String']>;
  newDelegate_not?: InputMaybe<Scalars['String']>;
  newDelegate_not_contains?: InputMaybe<Scalars['String']>;
  newDelegate_not_contains_nocase?: InputMaybe<Scalars['String']>;
  newDelegate_not_ends_with?: InputMaybe<Scalars['String']>;
  newDelegate_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  newDelegate_not_in?: InputMaybe<Array<Scalars['String']>>;
  newDelegate_not_starts_with?: InputMaybe<Scalars['String']>;
  newDelegate_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  newDelegate_starts_with?: InputMaybe<Scalars['String']>;
  newDelegate_starts_with_nocase?: InputMaybe<Scalars['String']>;
  noun?: InputMaybe<Scalars['String']>;
  noun_?: InputMaybe<Noun_Filter>;
  noun_contains?: InputMaybe<Scalars['String']>;
  noun_contains_nocase?: InputMaybe<Scalars['String']>;
  noun_ends_with?: InputMaybe<Scalars['String']>;
  noun_ends_with_nocase?: InputMaybe<Scalars['String']>;
  noun_gt?: InputMaybe<Scalars['String']>;
  noun_gte?: InputMaybe<Scalars['String']>;
  noun_in?: InputMaybe<Array<Scalars['String']>>;
  noun_lt?: InputMaybe<Scalars['String']>;
  noun_lte?: InputMaybe<Scalars['String']>;
  noun_not?: InputMaybe<Scalars['String']>;
  noun_not_contains?: InputMaybe<Scalars['String']>;
  noun_not_contains_nocase?: InputMaybe<Scalars['String']>;
  noun_not_ends_with?: InputMaybe<Scalars['String']>;
  noun_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  noun_not_in?: InputMaybe<Array<Scalars['String']>>;
  noun_not_starts_with?: InputMaybe<Scalars['String']>;
  noun_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  noun_starts_with?: InputMaybe<Scalars['String']>;
  noun_starts_with_nocase?: InputMaybe<Scalars['String']>;
  previousDelegate?: InputMaybe<Scalars['String']>;
  previousDelegate_?: InputMaybe<Delegate_Filter>;
  previousDelegate_contains?: InputMaybe<Scalars['String']>;
  previousDelegate_contains_nocase?: InputMaybe<Scalars['String']>;
  previousDelegate_ends_with?: InputMaybe<Scalars['String']>;
  previousDelegate_ends_with_nocase?: InputMaybe<Scalars['String']>;
  previousDelegate_gt?: InputMaybe<Scalars['String']>;
  previousDelegate_gte?: InputMaybe<Scalars['String']>;
  previousDelegate_in?: InputMaybe<Array<Scalars['String']>>;
  previousDelegate_lt?: InputMaybe<Scalars['String']>;
  previousDelegate_lte?: InputMaybe<Scalars['String']>;
  previousDelegate_not?: InputMaybe<Scalars['String']>;
  previousDelegate_not_contains?: InputMaybe<Scalars['String']>;
  previousDelegate_not_contains_nocase?: InputMaybe<Scalars['String']>;
  previousDelegate_not_ends_with?: InputMaybe<Scalars['String']>;
  previousDelegate_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  previousDelegate_not_in?: InputMaybe<Array<Scalars['String']>>;
  previousDelegate_not_starts_with?: InputMaybe<Scalars['String']>;
  previousDelegate_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  previousDelegate_starts_with?: InputMaybe<Scalars['String']>;
  previousDelegate_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum DelegationEvent_OrderBy {
  BlockNumber = 'blockNumber',
  BlockTimestamp = 'blockTimestamp',
  Id = 'id',
  NewDelegate = 'newDelegate',
  Noun = 'noun',
  PreviousDelegate = 'previousDelegate'
}

export type Governance = {
  __typename?: 'Governance';
  /** Total number of delegates participating on the governance currently */
  currentDelegates: Scalars['BigInt'];
  /** Total number of token holders currently */
  currentTokenHolders: Scalars['BigInt'];
  /** Total number of votes delegated expressed as a BigInt normalized value for the Nouns ERC721 Token */
  delegatedVotes: Scalars['BigInt'];
  /** Total number of votes delegated expressed in the smallest unit of the Nouns ERC721 Token */
  delegatedVotesRaw: Scalars['BigInt'];
  /** Unique entity used to keep track of common aggregated data */
  id: Scalars['ID'];
  /** Number of proposals created */
  proposals: Scalars['BigInt'];
  /** Number of proposals currently queued for execution */
  proposalsQueued: Scalars['BigInt'];
  /** Total number of delegates that held delegated votes */
  totalDelegates: Scalars['BigInt'];
  /** Total number of token holders */
  totalTokenHolders: Scalars['BigInt'];
};

export type Governance_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  currentDelegates?: InputMaybe<Scalars['BigInt']>;
  currentDelegates_gt?: InputMaybe<Scalars['BigInt']>;
  currentDelegates_gte?: InputMaybe<Scalars['BigInt']>;
  currentDelegates_in?: InputMaybe<Array<Scalars['BigInt']>>;
  currentDelegates_lt?: InputMaybe<Scalars['BigInt']>;
  currentDelegates_lte?: InputMaybe<Scalars['BigInt']>;
  currentDelegates_not?: InputMaybe<Scalars['BigInt']>;
  currentDelegates_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  currentTokenHolders?: InputMaybe<Scalars['BigInt']>;
  currentTokenHolders_gt?: InputMaybe<Scalars['BigInt']>;
  currentTokenHolders_gte?: InputMaybe<Scalars['BigInt']>;
  currentTokenHolders_in?: InputMaybe<Array<Scalars['BigInt']>>;
  currentTokenHolders_lt?: InputMaybe<Scalars['BigInt']>;
  currentTokenHolders_lte?: InputMaybe<Scalars['BigInt']>;
  currentTokenHolders_not?: InputMaybe<Scalars['BigInt']>;
  currentTokenHolders_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  delegatedVotes?: InputMaybe<Scalars['BigInt']>;
  delegatedVotesRaw?: InputMaybe<Scalars['BigInt']>;
  delegatedVotesRaw_gt?: InputMaybe<Scalars['BigInt']>;
  delegatedVotesRaw_gte?: InputMaybe<Scalars['BigInt']>;
  delegatedVotesRaw_in?: InputMaybe<Array<Scalars['BigInt']>>;
  delegatedVotesRaw_lt?: InputMaybe<Scalars['BigInt']>;
  delegatedVotesRaw_lte?: InputMaybe<Scalars['BigInt']>;
  delegatedVotesRaw_not?: InputMaybe<Scalars['BigInt']>;
  delegatedVotesRaw_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  delegatedVotes_gt?: InputMaybe<Scalars['BigInt']>;
  delegatedVotes_gte?: InputMaybe<Scalars['BigInt']>;
  delegatedVotes_in?: InputMaybe<Array<Scalars['BigInt']>>;
  delegatedVotes_lt?: InputMaybe<Scalars['BigInt']>;
  delegatedVotes_lte?: InputMaybe<Scalars['BigInt']>;
  delegatedVotes_not?: InputMaybe<Scalars['BigInt']>;
  delegatedVotes_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  proposals?: InputMaybe<Scalars['BigInt']>;
  proposalsQueued?: InputMaybe<Scalars['BigInt']>;
  proposalsQueued_gt?: InputMaybe<Scalars['BigInt']>;
  proposalsQueued_gte?: InputMaybe<Scalars['BigInt']>;
  proposalsQueued_in?: InputMaybe<Array<Scalars['BigInt']>>;
  proposalsQueued_lt?: InputMaybe<Scalars['BigInt']>;
  proposalsQueued_lte?: InputMaybe<Scalars['BigInt']>;
  proposalsQueued_not?: InputMaybe<Scalars['BigInt']>;
  proposalsQueued_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  proposals_gt?: InputMaybe<Scalars['BigInt']>;
  proposals_gte?: InputMaybe<Scalars['BigInt']>;
  proposals_in?: InputMaybe<Array<Scalars['BigInt']>>;
  proposals_lt?: InputMaybe<Scalars['BigInt']>;
  proposals_lte?: InputMaybe<Scalars['BigInt']>;
  proposals_not?: InputMaybe<Scalars['BigInt']>;
  proposals_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  totalDelegates?: InputMaybe<Scalars['BigInt']>;
  totalDelegates_gt?: InputMaybe<Scalars['BigInt']>;
  totalDelegates_gte?: InputMaybe<Scalars['BigInt']>;
  totalDelegates_in?: InputMaybe<Array<Scalars['BigInt']>>;
  totalDelegates_lt?: InputMaybe<Scalars['BigInt']>;
  totalDelegates_lte?: InputMaybe<Scalars['BigInt']>;
  totalDelegates_not?: InputMaybe<Scalars['BigInt']>;
  totalDelegates_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  totalTokenHolders?: InputMaybe<Scalars['BigInt']>;
  totalTokenHolders_gt?: InputMaybe<Scalars['BigInt']>;
  totalTokenHolders_gte?: InputMaybe<Scalars['BigInt']>;
  totalTokenHolders_in?: InputMaybe<Array<Scalars['BigInt']>>;
  totalTokenHolders_lt?: InputMaybe<Scalars['BigInt']>;
  totalTokenHolders_lte?: InputMaybe<Scalars['BigInt']>;
  totalTokenHolders_not?: InputMaybe<Scalars['BigInt']>;
  totalTokenHolders_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum Governance_OrderBy {
  CurrentDelegates = 'currentDelegates',
  CurrentTokenHolders = 'currentTokenHolders',
  DelegatedVotes = 'delegatedVotes',
  DelegatedVotesRaw = 'delegatedVotesRaw',
  Id = 'id',
  Proposals = 'proposals',
  ProposalsQueued = 'proposalsQueued',
  TotalDelegates = 'totalDelegates',
  TotalTokenHolders = 'totalTokenHolders'
}

export type LiquidDelegationLot = {
  __typename?: 'LiquidDelegationLot';
  authorityChain: Array<Scalars['String']>;
  rules?: Maybe<LiquidDelegationRules>;
};

export type LiquidDelegationRepresentation = {
  __typename?: 'LiquidDelegationRepresentation';
  delegate: Delegate;
  lots: Array<LiquidDelegationLot>;
};

export type LiquidDelegationRules = {
  __typename?: 'LiquidDelegationRules';
  blocksBeforeVoteCloses: Scalars['Int'];
  customRules: Array<Scalars['String']>;
  permissionPropose: Scalars['Boolean'];
  permissionSign: Scalars['Boolean'];
  permissionVote: Scalars['Boolean'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createNewDelegateStatement: WrappedDelegate;
};


export type MutationCreateNewDelegateStatementArgs = {
  data?: InputMaybe<CreateNewDelegateStatementData>;
};

export type Noun = {
  __typename?: 'Noun';
  /** The Noun's ERC721 token id */
  id: Scalars['ID'];
  number: Scalars['Int'];
  /** The owner of the Noun */
  owner: Account;
  /** The seed used to determine the Noun's traits */
  seed?: Maybe<Seed>;
  /** Historical votes for the Noun */
  votes: Array<Vote>;
};


export type NounVotesArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Vote_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Vote_Filter>;
};

export type Noun_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  owner?: InputMaybe<Scalars['String']>;
  owner_?: InputMaybe<Account_Filter>;
  owner_contains?: InputMaybe<Scalars['String']>;
  owner_contains_nocase?: InputMaybe<Scalars['String']>;
  owner_ends_with?: InputMaybe<Scalars['String']>;
  owner_ends_with_nocase?: InputMaybe<Scalars['String']>;
  owner_gt?: InputMaybe<Scalars['String']>;
  owner_gte?: InputMaybe<Scalars['String']>;
  owner_in?: InputMaybe<Array<Scalars['String']>>;
  owner_lt?: InputMaybe<Scalars['String']>;
  owner_lte?: InputMaybe<Scalars['String']>;
  owner_not?: InputMaybe<Scalars['String']>;
  owner_not_contains?: InputMaybe<Scalars['String']>;
  owner_not_contains_nocase?: InputMaybe<Scalars['String']>;
  owner_not_ends_with?: InputMaybe<Scalars['String']>;
  owner_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  owner_not_in?: InputMaybe<Array<Scalars['String']>>;
  owner_not_starts_with?: InputMaybe<Scalars['String']>;
  owner_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  owner_starts_with?: InputMaybe<Scalars['String']>;
  owner_starts_with_nocase?: InputMaybe<Scalars['String']>;
  seed?: InputMaybe<Scalars['String']>;
  seed_?: InputMaybe<Seed_Filter>;
  seed_contains?: InputMaybe<Scalars['String']>;
  seed_contains_nocase?: InputMaybe<Scalars['String']>;
  seed_ends_with?: InputMaybe<Scalars['String']>;
  seed_ends_with_nocase?: InputMaybe<Scalars['String']>;
  seed_gt?: InputMaybe<Scalars['String']>;
  seed_gte?: InputMaybe<Scalars['String']>;
  seed_in?: InputMaybe<Array<Scalars['String']>>;
  seed_lt?: InputMaybe<Scalars['String']>;
  seed_lte?: InputMaybe<Scalars['String']>;
  seed_not?: InputMaybe<Scalars['String']>;
  seed_not_contains?: InputMaybe<Scalars['String']>;
  seed_not_contains_nocase?: InputMaybe<Scalars['String']>;
  seed_not_ends_with?: InputMaybe<Scalars['String']>;
  seed_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  seed_not_in?: InputMaybe<Array<Scalars['String']>>;
  seed_not_starts_with?: InputMaybe<Scalars['String']>;
  seed_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  seed_starts_with?: InputMaybe<Scalars['String']>;
  seed_starts_with_nocase?: InputMaybe<Scalars['String']>;
  votes_?: InputMaybe<Vote_Filter>;
};

export enum Noun_OrderBy {
  Id = 'id',
  Owner = 'owner',
  Seed = 'seed',
  Votes = 'votes'
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type OverallMetrics = {
  __typename?: 'OverallMetrics';
  proposalThresholdBPS: Scalars['BigInt'];
  quorumVotesBPS: Scalars['BigInt'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  count: Scalars['Int'];
  endCursor: Scalars['String'];
  hasNextPage: Scalars['Boolean'];
  hasPreviousPage: Scalars['Boolean'];
  startCursor: Scalars['String'];
};

export type PropHouseProposal = {
  __typename?: 'PropHouseProposal';
  id: Scalars['ID'];
  number: Scalars['Int'];
  title: Scalars['String'];
};

export type PropHouseRound = {
  __typename?: 'PropHouseRound';
  currencyType: Scalars['String'];
  fundingAmount: Scalars['String'];
  id: Scalars['ID'];
  title: Scalars['String'];
};

export type PropHouseRoundVote = {
  __typename?: 'PropHouseRoundVote';
  proposal: PropHouseProposal;
  weight: Scalars['Int'];
};

export type PropHouseRoundVotes = {
  __typename?: 'PropHouseRoundVotes';
  createdAt: Scalars['BigInt'];
  id: Scalars['ID'];
  round: PropHouseRound;
  votes: Array<PropHouseRoundVote>;
};

export type Proposal = {
  __typename?: 'Proposal';
  /** The number of votes to abstain on the proposal */
  abstainVotes: Scalars['BigInt'];
  actualStatus: ActualProposalStatus;
  /** The number of votes against of the proposal */
  againstVotes: Scalars['BigInt'];
  /** Call data for the change */
  calldatas?: Maybe<Array<Scalars['Bytes']>>;
  /** The proposal creation block */
  createdBlock: Scalars['BigInt'];
  createdBlockGovernance: Governance;
  /** The proposal creation timestamp */
  createdTimestamp: Scalars['BigInt'];
  /** The proposal creation transaction hash */
  createdTransactionHash: Scalars['Bytes'];
  /** String description of the change */
  description: Scalars['String'];
  /** Block number from where the voting ends */
  endBlock: Scalars['BigInt'];
  /** Once the proposal is queued for execution it will have an ETA of the execution */
  executionETA?: Maybe<Scalars['BigInt']>;
  /** The number of votes in favor of the proposal */
  forVotes: Scalars['BigInt'];
  /** Internal proposal ID, in this implementation it seems to be a autoincremental id */
  id: Scalars['ID'];
  number: Scalars['Int'];
  /** The proposal threshold at the time of proposal creation */
  proposalThreshold: Scalars['BigInt'];
  /** Delegate that proposed the change */
  proposer: Delegate;
  /** The required number of votes for quorum at the time of proposal creation */
  quorumVotes: Scalars['BigInt'];
  /** Signature data for the change */
  signatures?: Maybe<Array<Scalars['String']>>;
  /** Block number from where the voting starts */
  startBlock: Scalars['BigInt'];
  /** Status of the proposal */
  status: ProposalStatus;
  /** Targets data for the change */
  targets?: Maybe<Array<Scalars['Bytes']>>;
  title: Scalars['String'];
  totalValue: Scalars['BigInt'];
  totalVotes: Scalars['BigInt'];
  /** Values data for the change */
  values?: Maybe<Array<Scalars['BigInt']>>;
  voteEndsAt: Scalars['BigInt'];
  voteStartsAt: Scalars['BigInt'];
  /** Votes associated to this proposal */
  votes: Array<Vote>;
};


export type ProposalVotesArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Vote_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Vote_Filter>;
};

export enum ProposalStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Executed = 'EXECUTED',
  Pending = 'PENDING',
  Queued = 'QUEUED',
  Vetoed = 'VETOED'
}

export type Proposal_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  abstainVotes?: InputMaybe<Scalars['BigInt']>;
  abstainVotes_gt?: InputMaybe<Scalars['BigInt']>;
  abstainVotes_gte?: InputMaybe<Scalars['BigInt']>;
  abstainVotes_in?: InputMaybe<Array<Scalars['BigInt']>>;
  abstainVotes_lt?: InputMaybe<Scalars['BigInt']>;
  abstainVotes_lte?: InputMaybe<Scalars['BigInt']>;
  abstainVotes_not?: InputMaybe<Scalars['BigInt']>;
  abstainVotes_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  againstVotes?: InputMaybe<Scalars['BigInt']>;
  againstVotes_gt?: InputMaybe<Scalars['BigInt']>;
  againstVotes_gte?: InputMaybe<Scalars['BigInt']>;
  againstVotes_in?: InputMaybe<Array<Scalars['BigInt']>>;
  againstVotes_lt?: InputMaybe<Scalars['BigInt']>;
  againstVotes_lte?: InputMaybe<Scalars['BigInt']>;
  againstVotes_not?: InputMaybe<Scalars['BigInt']>;
  againstVotes_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  calldatas?: InputMaybe<Array<Scalars['Bytes']>>;
  calldatas_contains?: InputMaybe<Array<Scalars['Bytes']>>;
  calldatas_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
  calldatas_not?: InputMaybe<Array<Scalars['Bytes']>>;
  calldatas_not_contains?: InputMaybe<Array<Scalars['Bytes']>>;
  calldatas_not_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
  createdBlock?: InputMaybe<Scalars['BigInt']>;
  createdBlock_gt?: InputMaybe<Scalars['BigInt']>;
  createdBlock_gte?: InputMaybe<Scalars['BigInt']>;
  createdBlock_in?: InputMaybe<Array<Scalars['BigInt']>>;
  createdBlock_lt?: InputMaybe<Scalars['BigInt']>;
  createdBlock_lte?: InputMaybe<Scalars['BigInt']>;
  createdBlock_not?: InputMaybe<Scalars['BigInt']>;
  createdBlock_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  createdTimestamp?: InputMaybe<Scalars['BigInt']>;
  createdTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
  createdTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
  createdTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  createdTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
  createdTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
  createdTimestamp_not?: InputMaybe<Scalars['BigInt']>;
  createdTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  createdTransactionHash?: InputMaybe<Scalars['Bytes']>;
  createdTransactionHash_contains?: InputMaybe<Scalars['Bytes']>;
  createdTransactionHash_in?: InputMaybe<Array<Scalars['Bytes']>>;
  createdTransactionHash_not?: InputMaybe<Scalars['Bytes']>;
  createdTransactionHash_not_contains?: InputMaybe<Scalars['Bytes']>;
  createdTransactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  description?: InputMaybe<Scalars['String']>;
  description_contains?: InputMaybe<Scalars['String']>;
  description_contains_nocase?: InputMaybe<Scalars['String']>;
  description_ends_with?: InputMaybe<Scalars['String']>;
  description_ends_with_nocase?: InputMaybe<Scalars['String']>;
  description_gt?: InputMaybe<Scalars['String']>;
  description_gte?: InputMaybe<Scalars['String']>;
  description_in?: InputMaybe<Array<Scalars['String']>>;
  description_lt?: InputMaybe<Scalars['String']>;
  description_lte?: InputMaybe<Scalars['String']>;
  description_not?: InputMaybe<Scalars['String']>;
  description_not_contains?: InputMaybe<Scalars['String']>;
  description_not_contains_nocase?: InputMaybe<Scalars['String']>;
  description_not_ends_with?: InputMaybe<Scalars['String']>;
  description_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  description_not_in?: InputMaybe<Array<Scalars['String']>>;
  description_not_starts_with?: InputMaybe<Scalars['String']>;
  description_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  description_starts_with?: InputMaybe<Scalars['String']>;
  description_starts_with_nocase?: InputMaybe<Scalars['String']>;
  endBlock?: InputMaybe<Scalars['BigInt']>;
  endBlock_gt?: InputMaybe<Scalars['BigInt']>;
  endBlock_gte?: InputMaybe<Scalars['BigInt']>;
  endBlock_in?: InputMaybe<Array<Scalars['BigInt']>>;
  endBlock_lt?: InputMaybe<Scalars['BigInt']>;
  endBlock_lte?: InputMaybe<Scalars['BigInt']>;
  endBlock_not?: InputMaybe<Scalars['BigInt']>;
  endBlock_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  executionETA?: InputMaybe<Scalars['BigInt']>;
  executionETA_gt?: InputMaybe<Scalars['BigInt']>;
  executionETA_gte?: InputMaybe<Scalars['BigInt']>;
  executionETA_in?: InputMaybe<Array<Scalars['BigInt']>>;
  executionETA_lt?: InputMaybe<Scalars['BigInt']>;
  executionETA_lte?: InputMaybe<Scalars['BigInt']>;
  executionETA_not?: InputMaybe<Scalars['BigInt']>;
  executionETA_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  forVotes?: InputMaybe<Scalars['BigInt']>;
  forVotes_gt?: InputMaybe<Scalars['BigInt']>;
  forVotes_gte?: InputMaybe<Scalars['BigInt']>;
  forVotes_in?: InputMaybe<Array<Scalars['BigInt']>>;
  forVotes_lt?: InputMaybe<Scalars['BigInt']>;
  forVotes_lte?: InputMaybe<Scalars['BigInt']>;
  forVotes_not?: InputMaybe<Scalars['BigInt']>;
  forVotes_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  proposalThreshold?: InputMaybe<Scalars['BigInt']>;
  proposalThreshold_gt?: InputMaybe<Scalars['BigInt']>;
  proposalThreshold_gte?: InputMaybe<Scalars['BigInt']>;
  proposalThreshold_in?: InputMaybe<Array<Scalars['BigInt']>>;
  proposalThreshold_lt?: InputMaybe<Scalars['BigInt']>;
  proposalThreshold_lte?: InputMaybe<Scalars['BigInt']>;
  proposalThreshold_not?: InputMaybe<Scalars['BigInt']>;
  proposalThreshold_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  proposer?: InputMaybe<Scalars['String']>;
  proposer_?: InputMaybe<Delegate_Filter>;
  proposer_contains?: InputMaybe<Scalars['String']>;
  proposer_contains_nocase?: InputMaybe<Scalars['String']>;
  proposer_ends_with?: InputMaybe<Scalars['String']>;
  proposer_ends_with_nocase?: InputMaybe<Scalars['String']>;
  proposer_gt?: InputMaybe<Scalars['String']>;
  proposer_gte?: InputMaybe<Scalars['String']>;
  proposer_in?: InputMaybe<Array<Scalars['String']>>;
  proposer_lt?: InputMaybe<Scalars['String']>;
  proposer_lte?: InputMaybe<Scalars['String']>;
  proposer_not?: InputMaybe<Scalars['String']>;
  proposer_not_contains?: InputMaybe<Scalars['String']>;
  proposer_not_contains_nocase?: InputMaybe<Scalars['String']>;
  proposer_not_ends_with?: InputMaybe<Scalars['String']>;
  proposer_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  proposer_not_in?: InputMaybe<Array<Scalars['String']>>;
  proposer_not_starts_with?: InputMaybe<Scalars['String']>;
  proposer_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  proposer_starts_with?: InputMaybe<Scalars['String']>;
  proposer_starts_with_nocase?: InputMaybe<Scalars['String']>;
  quorumVotes?: InputMaybe<Scalars['BigInt']>;
  quorumVotes_gt?: InputMaybe<Scalars['BigInt']>;
  quorumVotes_gte?: InputMaybe<Scalars['BigInt']>;
  quorumVotes_in?: InputMaybe<Array<Scalars['BigInt']>>;
  quorumVotes_lt?: InputMaybe<Scalars['BigInt']>;
  quorumVotes_lte?: InputMaybe<Scalars['BigInt']>;
  quorumVotes_not?: InputMaybe<Scalars['BigInt']>;
  quorumVotes_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  signatures?: InputMaybe<Array<Scalars['String']>>;
  signatures_contains?: InputMaybe<Array<Scalars['String']>>;
  signatures_contains_nocase?: InputMaybe<Array<Scalars['String']>>;
  signatures_not?: InputMaybe<Array<Scalars['String']>>;
  signatures_not_contains?: InputMaybe<Array<Scalars['String']>>;
  signatures_not_contains_nocase?: InputMaybe<Array<Scalars['String']>>;
  startBlock?: InputMaybe<Scalars['BigInt']>;
  startBlock_gt?: InputMaybe<Scalars['BigInt']>;
  startBlock_gte?: InputMaybe<Scalars['BigInt']>;
  startBlock_in?: InputMaybe<Array<Scalars['BigInt']>>;
  startBlock_lt?: InputMaybe<Scalars['BigInt']>;
  startBlock_lte?: InputMaybe<Scalars['BigInt']>;
  startBlock_not?: InputMaybe<Scalars['BigInt']>;
  startBlock_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  status?: InputMaybe<ProposalStatus>;
  status_in?: InputMaybe<Array<ProposalStatus>>;
  status_not?: InputMaybe<ProposalStatus>;
  status_not_in?: InputMaybe<Array<ProposalStatus>>;
  targets?: InputMaybe<Array<Scalars['Bytes']>>;
  targets_contains?: InputMaybe<Array<Scalars['Bytes']>>;
  targets_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
  targets_not?: InputMaybe<Array<Scalars['Bytes']>>;
  targets_not_contains?: InputMaybe<Array<Scalars['Bytes']>>;
  targets_not_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
  values?: InputMaybe<Array<Scalars['BigInt']>>;
  values_contains?: InputMaybe<Array<Scalars['BigInt']>>;
  values_contains_nocase?: InputMaybe<Array<Scalars['BigInt']>>;
  values_not?: InputMaybe<Array<Scalars['BigInt']>>;
  values_not_contains?: InputMaybe<Array<Scalars['BigInt']>>;
  values_not_contains_nocase?: InputMaybe<Array<Scalars['BigInt']>>;
  votes_?: InputMaybe<Vote_Filter>;
};

export enum Proposal_OrderBy {
  AbstainVotes = 'abstainVotes',
  AgainstVotes = 'againstVotes',
  Calldatas = 'calldatas',
  CreatedBlock = 'createdBlock',
  CreatedTimestamp = 'createdTimestamp',
  CreatedTransactionHash = 'createdTransactionHash',
  Description = 'description',
  EndBlock = 'endBlock',
  ExecutionEta = 'executionETA',
  ForVotes = 'forVotes',
  Id = 'id',
  ProposalThreshold = 'proposalThreshold',
  Proposer = 'proposer',
  QuorumVotes = 'quorumVotes',
  Signatures = 'signatures',
  StartBlock = 'startBlock',
  Status = 'status',
  Targets = 'targets',
  Values = 'values',
  Votes = 'votes'
}

export type Query = {
  __typename?: 'Query';
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  account?: Maybe<Account>;
  accounts: Array<Account>;
  address?: Maybe<Address>;
  auction?: Maybe<Auction>;
  auctions: Array<Auction>;
  bid?: Maybe<Bid>;
  bids: Array<Bid>;
  currentGovernance: Governance;
  delegate?: Maybe<Delegate>;
  delegates: Array<Delegate>;
  delegationEvent?: Maybe<DelegationEvent>;
  delegationEvents: Array<DelegationEvent>;
  governance?: Maybe<Governance>;
  governances: Array<Governance>;
  metrics: OverallMetrics;
  noun?: Maybe<Noun>;
  nouns: Array<Noun>;
  proposal?: Maybe<Proposal>;
  proposals: Array<Proposal>;
  seed?: Maybe<Seed>;
  seeds: Array<Seed>;
  transferEvent?: Maybe<TransferEvent>;
  transferEvents: Array<TransferEvent>;
  vote?: Maybe<Vote>;
  votes: Array<Vote>;
  wrappedDelegates: WrappedDelegatesConnection;
};


export type Query_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};


export type QueryAccountArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryAccountsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Account_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Account_Filter>;
};


export type QueryAddressArgs = {
  addressOrEnsName: Scalars['String'];
};


export type QueryAuctionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryAuctionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Auction_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Auction_Filter>;
};


export type QueryBidArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBidsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Bid_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Bid_Filter>;
};


export type QueryDelegateArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryDelegatesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Delegate_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Delegate_Filter>;
};


export type QueryDelegationEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryDelegationEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<DelegationEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<DelegationEvent_Filter>;
};


export type QueryGovernanceArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryGovernancesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Governance_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Governance_Filter>;
};


export type QueryNounArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryNounsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Noun_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Noun_Filter>;
};


export type QueryProposalArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryProposalsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Proposal_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Proposal_Filter>;
};


export type QuerySeedArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerySeedsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Seed_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Seed_Filter>;
};


export type QueryTransferEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTransferEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<TransferEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TransferEvent_Filter>;
};


export type QueryVoteArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryVotesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Vote_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Vote_Filter>;
};


export type QueryWrappedDelegatesArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  orderBy?: WrappedDelegatesOrder;
  where?: InputMaybe<WrappedDelegatesWhere>;
};

export type ResolvedName = {
  __typename?: 'ResolvedName';
  address: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
};

export type Seed = {
  __typename?: 'Seed';
  /** The accessory index */
  accessory: Scalars['BigInt'];
  /** The background index */
  background: Scalars['BigInt'];
  /** The body index */
  body: Scalars['BigInt'];
  /** The glasses index */
  glasses: Scalars['BigInt'];
  /** The head index */
  head: Scalars['BigInt'];
  /** The Noun's ERC721 token id */
  id: Scalars['ID'];
};

export type Seed_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  accessory?: InputMaybe<Scalars['BigInt']>;
  accessory_gt?: InputMaybe<Scalars['BigInt']>;
  accessory_gte?: InputMaybe<Scalars['BigInt']>;
  accessory_in?: InputMaybe<Array<Scalars['BigInt']>>;
  accessory_lt?: InputMaybe<Scalars['BigInt']>;
  accessory_lte?: InputMaybe<Scalars['BigInt']>;
  accessory_not?: InputMaybe<Scalars['BigInt']>;
  accessory_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  background?: InputMaybe<Scalars['BigInt']>;
  background_gt?: InputMaybe<Scalars['BigInt']>;
  background_gte?: InputMaybe<Scalars['BigInt']>;
  background_in?: InputMaybe<Array<Scalars['BigInt']>>;
  background_lt?: InputMaybe<Scalars['BigInt']>;
  background_lte?: InputMaybe<Scalars['BigInt']>;
  background_not?: InputMaybe<Scalars['BigInt']>;
  background_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  body?: InputMaybe<Scalars['BigInt']>;
  body_gt?: InputMaybe<Scalars['BigInt']>;
  body_gte?: InputMaybe<Scalars['BigInt']>;
  body_in?: InputMaybe<Array<Scalars['BigInt']>>;
  body_lt?: InputMaybe<Scalars['BigInt']>;
  body_lte?: InputMaybe<Scalars['BigInt']>;
  body_not?: InputMaybe<Scalars['BigInt']>;
  body_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  glasses?: InputMaybe<Scalars['BigInt']>;
  glasses_gt?: InputMaybe<Scalars['BigInt']>;
  glasses_gte?: InputMaybe<Scalars['BigInt']>;
  glasses_in?: InputMaybe<Array<Scalars['BigInt']>>;
  glasses_lt?: InputMaybe<Scalars['BigInt']>;
  glasses_lte?: InputMaybe<Scalars['BigInt']>;
  glasses_not?: InputMaybe<Scalars['BigInt']>;
  glasses_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  head?: InputMaybe<Scalars['BigInt']>;
  head_gt?: InputMaybe<Scalars['BigInt']>;
  head_gte?: InputMaybe<Scalars['BigInt']>;
  head_in?: InputMaybe<Array<Scalars['BigInt']>>;
  head_lt?: InputMaybe<Scalars['BigInt']>;
  head_lte?: InputMaybe<Scalars['BigInt']>;
  head_not?: InputMaybe<Scalars['BigInt']>;
  head_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
};

export enum Seed_OrderBy {
  Accessory = 'accessory',
  Background = 'background',
  Body = 'body',
  Glasses = 'glasses',
  Head = 'head',
  Id = 'id'
}

export type Subscription = {
  __typename?: 'Subscription';
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  account?: Maybe<Account>;
  accounts: Array<Account>;
  auction?: Maybe<Auction>;
  auctions: Array<Auction>;
  bid?: Maybe<Bid>;
  bids: Array<Bid>;
  delegate?: Maybe<Delegate>;
  delegates: Array<Delegate>;
  delegationEvent?: Maybe<DelegationEvent>;
  delegationEvents: Array<DelegationEvent>;
  governance?: Maybe<Governance>;
  governances: Array<Governance>;
  noun?: Maybe<Noun>;
  nouns: Array<Noun>;
  proposal?: Maybe<Proposal>;
  proposals: Array<Proposal>;
  seed?: Maybe<Seed>;
  seeds: Array<Seed>;
  transferEvent?: Maybe<TransferEvent>;
  transferEvents: Array<TransferEvent>;
  vote?: Maybe<Vote>;
  votes: Array<Vote>;
};


export type Subscription_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};


export type SubscriptionAccountArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionAccountsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Account_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Account_Filter>;
};


export type SubscriptionAuctionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionAuctionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Auction_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Auction_Filter>;
};


export type SubscriptionBidArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionBidsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Bid_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Bid_Filter>;
};


export type SubscriptionDelegateArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionDelegatesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Delegate_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Delegate_Filter>;
};


export type SubscriptionDelegationEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionDelegationEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<DelegationEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<DelegationEvent_Filter>;
};


export type SubscriptionGovernanceArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionGovernancesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Governance_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Governance_Filter>;
};


export type SubscriptionNounArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionNounsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Noun_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Noun_Filter>;
};


export type SubscriptionProposalArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionProposalsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Proposal_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Proposal_Filter>;
};


export type SubscriptionSeedArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionSeedsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Seed_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Seed_Filter>;
};


export type SubscriptionTransferEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTransferEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<TransferEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TransferEvent_Filter>;
};


export type SubscriptionVoteArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionVotesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Vote_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Vote_Filter>;
};

export type TopIssue = {
  __typename?: 'TopIssue';
  type: Scalars['String'];
  value: Scalars['String'];
};

export type TransferEvent = {
  __typename?: 'TransferEvent';
  /** Block number of the event */
  blockNumber: Scalars['BigInt'];
  /** The timestamp of the block the event is in */
  blockTimestamp: Scalars['BigInt'];
  /** The txn hash of this event */
  id: Scalars['ID'];
  /** New holder address */
  newHolder: Account;
  /** The Noun being transfered */
  noun: Noun;
  /** Previous holder address */
  previousHolder: Account;
};

export type TransferEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  blockNumber?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  newHolder?: InputMaybe<Scalars['String']>;
  newHolder_?: InputMaybe<Account_Filter>;
  newHolder_contains?: InputMaybe<Scalars['String']>;
  newHolder_contains_nocase?: InputMaybe<Scalars['String']>;
  newHolder_ends_with?: InputMaybe<Scalars['String']>;
  newHolder_ends_with_nocase?: InputMaybe<Scalars['String']>;
  newHolder_gt?: InputMaybe<Scalars['String']>;
  newHolder_gte?: InputMaybe<Scalars['String']>;
  newHolder_in?: InputMaybe<Array<Scalars['String']>>;
  newHolder_lt?: InputMaybe<Scalars['String']>;
  newHolder_lte?: InputMaybe<Scalars['String']>;
  newHolder_not?: InputMaybe<Scalars['String']>;
  newHolder_not_contains?: InputMaybe<Scalars['String']>;
  newHolder_not_contains_nocase?: InputMaybe<Scalars['String']>;
  newHolder_not_ends_with?: InputMaybe<Scalars['String']>;
  newHolder_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  newHolder_not_in?: InputMaybe<Array<Scalars['String']>>;
  newHolder_not_starts_with?: InputMaybe<Scalars['String']>;
  newHolder_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  newHolder_starts_with?: InputMaybe<Scalars['String']>;
  newHolder_starts_with_nocase?: InputMaybe<Scalars['String']>;
  noun?: InputMaybe<Scalars['String']>;
  noun_?: InputMaybe<Noun_Filter>;
  noun_contains?: InputMaybe<Scalars['String']>;
  noun_contains_nocase?: InputMaybe<Scalars['String']>;
  noun_ends_with?: InputMaybe<Scalars['String']>;
  noun_ends_with_nocase?: InputMaybe<Scalars['String']>;
  noun_gt?: InputMaybe<Scalars['String']>;
  noun_gte?: InputMaybe<Scalars['String']>;
  noun_in?: InputMaybe<Array<Scalars['String']>>;
  noun_lt?: InputMaybe<Scalars['String']>;
  noun_lte?: InputMaybe<Scalars['String']>;
  noun_not?: InputMaybe<Scalars['String']>;
  noun_not_contains?: InputMaybe<Scalars['String']>;
  noun_not_contains_nocase?: InputMaybe<Scalars['String']>;
  noun_not_ends_with?: InputMaybe<Scalars['String']>;
  noun_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  noun_not_in?: InputMaybe<Array<Scalars['String']>>;
  noun_not_starts_with?: InputMaybe<Scalars['String']>;
  noun_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  noun_starts_with?: InputMaybe<Scalars['String']>;
  noun_starts_with_nocase?: InputMaybe<Scalars['String']>;
  previousHolder?: InputMaybe<Scalars['String']>;
  previousHolder_?: InputMaybe<Account_Filter>;
  previousHolder_contains?: InputMaybe<Scalars['String']>;
  previousHolder_contains_nocase?: InputMaybe<Scalars['String']>;
  previousHolder_ends_with?: InputMaybe<Scalars['String']>;
  previousHolder_ends_with_nocase?: InputMaybe<Scalars['String']>;
  previousHolder_gt?: InputMaybe<Scalars['String']>;
  previousHolder_gte?: InputMaybe<Scalars['String']>;
  previousHolder_in?: InputMaybe<Array<Scalars['String']>>;
  previousHolder_lt?: InputMaybe<Scalars['String']>;
  previousHolder_lte?: InputMaybe<Scalars['String']>;
  previousHolder_not?: InputMaybe<Scalars['String']>;
  previousHolder_not_contains?: InputMaybe<Scalars['String']>;
  previousHolder_not_contains_nocase?: InputMaybe<Scalars['String']>;
  previousHolder_not_ends_with?: InputMaybe<Scalars['String']>;
  previousHolder_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  previousHolder_not_in?: InputMaybe<Array<Scalars['String']>>;
  previousHolder_not_starts_with?: InputMaybe<Scalars['String']>;
  previousHolder_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  previousHolder_starts_with?: InputMaybe<Scalars['String']>;
  previousHolder_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum TransferEvent_OrderBy {
  BlockNumber = 'blockNumber',
  BlockTimestamp = 'blockTimestamp',
  Id = 'id',
  NewHolder = 'newHolder',
  Noun = 'noun',
  PreviousHolder = 'previousHolder'
}

export type ValueWithSignature = {
  signature: Scalars['String'];
  signerAddress: Scalars['String'];
  value: Scalars['String'];
};

export type Vote = {
  __typename?: 'Vote';
  /** Block number of vote */
  blockNumber: Scalars['BigInt'];
  createdAt?: Maybe<Scalars['BigInt']>;
  /** Delegate ID + Proposal ID */
  id: Scalars['ID'];
  /** The Nouns used to vote */
  nouns?: Maybe<Array<Noun>>;
  /** Proposal that is being voted on */
  proposal: Proposal;
  /** The optional vote reason */
  reason?: Maybe<Scalars['String']>;
  /** Whether the vote is in favour of the proposal */
  support: Scalars['Boolean'];
  /** The integer support value: against (0), for (1), or abstain (2) */
  supportDetailed: Scalars['Int'];
  /** Delegate that emitted the vote */
  voter: Delegate;
  /** Amount of votes in favour or against expressed as a BigInt normalized value for the Nouns ERC721 Token */
  votes: Scalars['BigInt'];
  /** Amount of votes in favour or against expressed in the smallest unit of the Nouns ERC721 Token */
  votesRaw: Scalars['BigInt'];
};


export type VoteNounsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Noun_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Noun_Filter>;
};

export type Vote_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  blockNumber?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  nouns?: InputMaybe<Array<Scalars['String']>>;
  nouns_?: InputMaybe<Noun_Filter>;
  nouns_contains?: InputMaybe<Array<Scalars['String']>>;
  nouns_contains_nocase?: InputMaybe<Array<Scalars['String']>>;
  nouns_not?: InputMaybe<Array<Scalars['String']>>;
  nouns_not_contains?: InputMaybe<Array<Scalars['String']>>;
  nouns_not_contains_nocase?: InputMaybe<Array<Scalars['String']>>;
  proposal?: InputMaybe<Scalars['String']>;
  proposal_?: InputMaybe<Proposal_Filter>;
  proposal_contains?: InputMaybe<Scalars['String']>;
  proposal_contains_nocase?: InputMaybe<Scalars['String']>;
  proposal_ends_with?: InputMaybe<Scalars['String']>;
  proposal_ends_with_nocase?: InputMaybe<Scalars['String']>;
  proposal_gt?: InputMaybe<Scalars['String']>;
  proposal_gte?: InputMaybe<Scalars['String']>;
  proposal_in?: InputMaybe<Array<Scalars['String']>>;
  proposal_lt?: InputMaybe<Scalars['String']>;
  proposal_lte?: InputMaybe<Scalars['String']>;
  proposal_not?: InputMaybe<Scalars['String']>;
  proposal_not_contains?: InputMaybe<Scalars['String']>;
  proposal_not_contains_nocase?: InputMaybe<Scalars['String']>;
  proposal_not_ends_with?: InputMaybe<Scalars['String']>;
  proposal_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  proposal_not_in?: InputMaybe<Array<Scalars['String']>>;
  proposal_not_starts_with?: InputMaybe<Scalars['String']>;
  proposal_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  proposal_starts_with?: InputMaybe<Scalars['String']>;
  proposal_starts_with_nocase?: InputMaybe<Scalars['String']>;
  reason?: InputMaybe<Scalars['String']>;
  reason_contains?: InputMaybe<Scalars['String']>;
  reason_contains_nocase?: InputMaybe<Scalars['String']>;
  reason_ends_with?: InputMaybe<Scalars['String']>;
  reason_ends_with_nocase?: InputMaybe<Scalars['String']>;
  reason_gt?: InputMaybe<Scalars['String']>;
  reason_gte?: InputMaybe<Scalars['String']>;
  reason_in?: InputMaybe<Array<Scalars['String']>>;
  reason_lt?: InputMaybe<Scalars['String']>;
  reason_lte?: InputMaybe<Scalars['String']>;
  reason_not?: InputMaybe<Scalars['String']>;
  reason_not_contains?: InputMaybe<Scalars['String']>;
  reason_not_contains_nocase?: InputMaybe<Scalars['String']>;
  reason_not_ends_with?: InputMaybe<Scalars['String']>;
  reason_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  reason_not_in?: InputMaybe<Array<Scalars['String']>>;
  reason_not_starts_with?: InputMaybe<Scalars['String']>;
  reason_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  reason_starts_with?: InputMaybe<Scalars['String']>;
  reason_starts_with_nocase?: InputMaybe<Scalars['String']>;
  support?: InputMaybe<Scalars['Boolean']>;
  supportDetailed?: InputMaybe<Scalars['Int']>;
  supportDetailed_gt?: InputMaybe<Scalars['Int']>;
  supportDetailed_gte?: InputMaybe<Scalars['Int']>;
  supportDetailed_in?: InputMaybe<Array<Scalars['Int']>>;
  supportDetailed_lt?: InputMaybe<Scalars['Int']>;
  supportDetailed_lte?: InputMaybe<Scalars['Int']>;
  supportDetailed_not?: InputMaybe<Scalars['Int']>;
  supportDetailed_not_in?: InputMaybe<Array<Scalars['Int']>>;
  support_in?: InputMaybe<Array<Scalars['Boolean']>>;
  support_not?: InputMaybe<Scalars['Boolean']>;
  support_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
  voter?: InputMaybe<Scalars['String']>;
  voter_?: InputMaybe<Delegate_Filter>;
  voter_contains?: InputMaybe<Scalars['String']>;
  voter_contains_nocase?: InputMaybe<Scalars['String']>;
  voter_ends_with?: InputMaybe<Scalars['String']>;
  voter_ends_with_nocase?: InputMaybe<Scalars['String']>;
  voter_gt?: InputMaybe<Scalars['String']>;
  voter_gte?: InputMaybe<Scalars['String']>;
  voter_in?: InputMaybe<Array<Scalars['String']>>;
  voter_lt?: InputMaybe<Scalars['String']>;
  voter_lte?: InputMaybe<Scalars['String']>;
  voter_not?: InputMaybe<Scalars['String']>;
  voter_not_contains?: InputMaybe<Scalars['String']>;
  voter_not_contains_nocase?: InputMaybe<Scalars['String']>;
  voter_not_ends_with?: InputMaybe<Scalars['String']>;
  voter_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  voter_not_in?: InputMaybe<Array<Scalars['String']>>;
  voter_not_starts_with?: InputMaybe<Scalars['String']>;
  voter_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  voter_starts_with?: InputMaybe<Scalars['String']>;
  voter_starts_with_nocase?: InputMaybe<Scalars['String']>;
  votes?: InputMaybe<Scalars['BigInt']>;
  votesRaw?: InputMaybe<Scalars['BigInt']>;
  votesRaw_gt?: InputMaybe<Scalars['BigInt']>;
  votesRaw_gte?: InputMaybe<Scalars['BigInt']>;
  votesRaw_in?: InputMaybe<Array<Scalars['BigInt']>>;
  votesRaw_lt?: InputMaybe<Scalars['BigInt']>;
  votesRaw_lte?: InputMaybe<Scalars['BigInt']>;
  votesRaw_not?: InputMaybe<Scalars['BigInt']>;
  votesRaw_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  votes_gt?: InputMaybe<Scalars['BigInt']>;
  votes_gte?: InputMaybe<Scalars['BigInt']>;
  votes_in?: InputMaybe<Array<Scalars['BigInt']>>;
  votes_lt?: InputMaybe<Scalars['BigInt']>;
  votes_lte?: InputMaybe<Scalars['BigInt']>;
  votes_not?: InputMaybe<Scalars['BigInt']>;
  votes_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum Vote_OrderBy {
  BlockNumber = 'blockNumber',
  Id = 'id',
  Nouns = 'nouns',
  Proposal = 'proposal',
  Reason = 'reason',
  Support = 'support',
  SupportDetailed = 'supportDetailed',
  Voter = 'voter',
  Votes = 'votes',
  VotesRaw = 'votesRaw'
}

export type WrappedDelegate = {
  __typename?: 'WrappedDelegate';
  address: Address;
  delegate?: Maybe<Delegate>;
  id: Scalars['ID'];
  statement?: Maybe<DelegateStatement>;
};

export type WrappedDelegatesConnection = {
  __typename?: 'WrappedDelegatesConnection';
  edges: Array<WrappedDelegatesEdge>;
  pageInfo: PageInfo;
};

export type WrappedDelegatesEdge = {
  __typename?: 'WrappedDelegatesEdge';
  cursor: Scalars['String'];
  node: WrappedDelegate;
};

export enum WrappedDelegatesOrder {
  LeastVotesCast = 'leastVotesCast',
  MostNounsRepresented = 'mostNounsRepresented',
  MostRecentlyActive = 'mostRecentlyActive',
  MostRelevant = 'mostRelevant',
  MostVotesCast = 'mostVotesCast'
}

export enum WrappedDelegatesWhere {
  SeekingDelegation = 'seekingDelegation',
  WithStatement = 'withStatement'
}

export type _Block_ = {
  __typename?: '_Block_';
  /** The hash of the block */
  hash?: Maybe<Scalars['Bytes']>;
  /** The block number */
  number: Scalars['Int'];
  /** Timestamp of the block if available, format depends on the chain */
  timestamp?: Maybe<Scalars['String']>;
};

/** The type for the top-level _meta field */
export type _Meta_ = {
  __typename?: '_Meta_';
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   */
  block: _Block_;
  /** The deployment ID */
  deployment: Scalars['String'];
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean'];
};

export enum _SubgraphErrorPolicy_ {
  /** Data will be returned even if the subgraph has indexing errors */
  Allow = 'allow',
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  Deny = 'deny'
}



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Account: ResolverTypeWrapper<Omit<Account, 'address' | 'delegate' | 'nouns'> & { address: ResolversTypes['Address'], delegate?: Maybe<ResolversTypes['Delegate']>, nouns: Array<ResolversTypes['Noun']> }>;
  Account_filter: Account_Filter;
  Account_orderBy: Account_OrderBy;
  ActualProposalStatus: ActualProposalStatus;
  Address: ResolverTypeWrapper<AddressModel>;
  Auction: ResolverTypeWrapper<Omit<Auction, 'bidder' | 'bids' | 'noun'> & { bidder?: Maybe<ResolversTypes['Account']>, bids: Array<ResolversTypes['Bid']>, noun: ResolversTypes['Noun'] }>;
  Auction_filter: Auction_Filter;
  Auction_orderBy: Auction_OrderBy;
  Bid: ResolverTypeWrapper<Omit<Bid, 'auction' | 'bidder' | 'noun'> & { auction: ResolversTypes['Auction'], bidder?: Maybe<ResolversTypes['Account']>, noun: ResolversTypes['Noun'] }>;
  Bid_filter: Bid_Filter;
  Bid_orderBy: Bid_OrderBy;
  BigDecimal: ResolverTypeWrapper<Scalars['BigDecimal']>;
  BigInt: ResolverTypeWrapper<Scalars['BigInt']>;
  BlockChangedFilter: BlockChangedFilter;
  Block_height: Block_Height;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Bytes: ResolverTypeWrapper<Scalars['Bytes']>;
  CreateNewDelegateStatementData: CreateNewDelegateStatementData;
  Delegate: ResolverTypeWrapper<Omit<Delegate, 'address' | 'liquidRepresentation' | 'nounsRepresented' | 'proposals' | 'resolvedName' | 'tokenHoldersRepresented' | 'votes'> & { address: ResolversTypes['Address'], liquidRepresentation: Array<ResolversTypes['LiquidDelegationRepresentation']>, nounsRepresented: Array<ResolversTypes['Noun']>, proposals: Array<ResolversTypes['Proposal']>, resolvedName: ResolversTypes['ResolvedName'], tokenHoldersRepresented: Array<ResolversTypes['Account']>, votes: Array<ResolversTypes['Vote']> }>;
  DelegateStatement: ResolverTypeWrapper<DelegateStatementModel>;
  DelegateVotesSummary: ResolverTypeWrapper<DelegateVotesSummary>;
  Delegate_filter: Delegate_Filter;
  Delegate_orderBy: Delegate_OrderBy;
  DelegationEvent: ResolverTypeWrapper<Omit<DelegationEvent, 'newDelegate' | 'noun' | 'previousDelegate'> & { newDelegate: ResolversTypes['Delegate'], noun: ResolversTypes['Noun'], previousDelegate: ResolversTypes['Delegate'] }>;
  DelegationEvent_filter: DelegationEvent_Filter;
  DelegationEvent_orderBy: DelegationEvent_OrderBy;
  Governance: ResolverTypeWrapper<Governance>;
  Governance_filter: Governance_Filter;
  Governance_orderBy: Governance_OrderBy;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  LiquidDelegationLot: ResolverTypeWrapper<LiquidDelegationLotModel>;
  LiquidDelegationRepresentation: ResolverTypeWrapper<LiquidDelegationRepresentationModel>;
  LiquidDelegationRules: ResolverTypeWrapper<LiquidDelegationRulesModel>;
  Mutation: ResolverTypeWrapper<{}>;
  Noun: ResolverTypeWrapper<Omit<Noun, 'owner' | 'votes'> & { owner: ResolversTypes['Account'], votes: Array<ResolversTypes['Vote']> }>;
  Noun_filter: Noun_Filter;
  Noun_orderBy: Noun_OrderBy;
  OrderDirection: OrderDirection;
  OverallMetrics: ResolverTypeWrapper<OverallMetricsModel>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  PropHouseProposal: ResolverTypeWrapper<PropHouseProposal>;
  PropHouseRound: ResolverTypeWrapper<PropHouseRound>;
  PropHouseRoundVote: ResolverTypeWrapper<PropHouseRoundVote>;
  PropHouseRoundVotes: ResolverTypeWrapper<PropHouseRoundVotes>;
  Proposal: ResolverTypeWrapper<Omit<Proposal, 'proposer' | 'votes'> & { proposer: ResolversTypes['Delegate'], votes: Array<ResolversTypes['Vote']> }>;
  ProposalStatus: ProposalStatus;
  Proposal_filter: Proposal_Filter;
  Proposal_orderBy: Proposal_OrderBy;
  Query: ResolverTypeWrapper<{}>;
  ResolvedName: ResolverTypeWrapper<ResolvedNameModel>;
  Seed: ResolverTypeWrapper<Seed>;
  Seed_filter: Seed_Filter;
  Seed_orderBy: Seed_OrderBy;
  String: ResolverTypeWrapper<Scalars['String']>;
  Subscription: ResolverTypeWrapper<{}>;
  TopIssue: ResolverTypeWrapper<TopIssue>;
  TransferEvent: ResolverTypeWrapper<Omit<TransferEvent, 'newHolder' | 'noun' | 'previousHolder'> & { newHolder: ResolversTypes['Account'], noun: ResolversTypes['Noun'], previousHolder: ResolversTypes['Account'] }>;
  TransferEvent_filter: TransferEvent_Filter;
  TransferEvent_orderBy: TransferEvent_OrderBy;
  ValueWithSignature: ValueWithSignature;
  Vote: ResolverTypeWrapper<Omit<Vote, 'nouns' | 'proposal' | 'voter'> & { nouns?: Maybe<Array<ResolversTypes['Noun']>>, proposal: ResolversTypes['Proposal'], voter: ResolversTypes['Delegate'] }>;
  Vote_filter: Vote_Filter;
  Vote_orderBy: Vote_OrderBy;
  WrappedDelegate: ResolverTypeWrapper<WrappedDelegateModel>;
  WrappedDelegatesConnection: ResolverTypeWrapper<Omit<WrappedDelegatesConnection, 'edges'> & { edges: Array<ResolversTypes['WrappedDelegatesEdge']> }>;
  WrappedDelegatesEdge: ResolverTypeWrapper<Omit<WrappedDelegatesEdge, 'node'> & { node: ResolversTypes['WrappedDelegate'] }>;
  WrappedDelegatesOrder: WrappedDelegatesOrder;
  WrappedDelegatesWhere: WrappedDelegatesWhere;
  _Block_: ResolverTypeWrapper<_Block_>;
  _Meta_: ResolverTypeWrapper<_Meta_>;
  _SubgraphErrorPolicy_: _SubgraphErrorPolicy_;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Account: Omit<Account, 'address' | 'delegate' | 'nouns'> & { address: ResolversParentTypes['Address'], delegate?: Maybe<ResolversParentTypes['Delegate']>, nouns: Array<ResolversParentTypes['Noun']> };
  Account_filter: Account_Filter;
  Address: AddressModel;
  Auction: Omit<Auction, 'bidder' | 'bids' | 'noun'> & { bidder?: Maybe<ResolversParentTypes['Account']>, bids: Array<ResolversParentTypes['Bid']>, noun: ResolversParentTypes['Noun'] };
  Auction_filter: Auction_Filter;
  Bid: Omit<Bid, 'auction' | 'bidder' | 'noun'> & { auction: ResolversParentTypes['Auction'], bidder?: Maybe<ResolversParentTypes['Account']>, noun: ResolversParentTypes['Noun'] };
  Bid_filter: Bid_Filter;
  BigDecimal: Scalars['BigDecimal'];
  BigInt: Scalars['BigInt'];
  BlockChangedFilter: BlockChangedFilter;
  Block_height: Block_Height;
  Boolean: Scalars['Boolean'];
  Bytes: Scalars['Bytes'];
  CreateNewDelegateStatementData: CreateNewDelegateStatementData;
  Delegate: Omit<Delegate, 'address' | 'liquidRepresentation' | 'nounsRepresented' | 'proposals' | 'resolvedName' | 'tokenHoldersRepresented' | 'votes'> & { address: ResolversParentTypes['Address'], liquidRepresentation: Array<ResolversParentTypes['LiquidDelegationRepresentation']>, nounsRepresented: Array<ResolversParentTypes['Noun']>, proposals: Array<ResolversParentTypes['Proposal']>, resolvedName: ResolversParentTypes['ResolvedName'], tokenHoldersRepresented: Array<ResolversParentTypes['Account']>, votes: Array<ResolversParentTypes['Vote']> };
  DelegateStatement: DelegateStatementModel;
  DelegateVotesSummary: DelegateVotesSummary;
  Delegate_filter: Delegate_Filter;
  DelegationEvent: Omit<DelegationEvent, 'newDelegate' | 'noun' | 'previousDelegate'> & { newDelegate: ResolversParentTypes['Delegate'], noun: ResolversParentTypes['Noun'], previousDelegate: ResolversParentTypes['Delegate'] };
  DelegationEvent_filter: DelegationEvent_Filter;
  Governance: Governance;
  Governance_filter: Governance_Filter;
  ID: Scalars['ID'];
  Int: Scalars['Int'];
  LiquidDelegationLot: LiquidDelegationLotModel;
  LiquidDelegationRepresentation: LiquidDelegationRepresentationModel;
  LiquidDelegationRules: LiquidDelegationRulesModel;
  Mutation: {};
  Noun: Omit<Noun, 'owner' | 'votes'> & { owner: ResolversParentTypes['Account'], votes: Array<ResolversParentTypes['Vote']> };
  Noun_filter: Noun_Filter;
  OverallMetrics: OverallMetricsModel;
  PageInfo: PageInfo;
  PropHouseProposal: PropHouseProposal;
  PropHouseRound: PropHouseRound;
  PropHouseRoundVote: PropHouseRoundVote;
  PropHouseRoundVotes: PropHouseRoundVotes;
  Proposal: Omit<Proposal, 'proposer' | 'votes'> & { proposer: ResolversParentTypes['Delegate'], votes: Array<ResolversParentTypes['Vote']> };
  Proposal_filter: Proposal_Filter;
  Query: {};
  ResolvedName: ResolvedNameModel;
  Seed: Seed;
  Seed_filter: Seed_Filter;
  String: Scalars['String'];
  Subscription: {};
  TopIssue: TopIssue;
  TransferEvent: Omit<TransferEvent, 'newHolder' | 'noun' | 'previousHolder'> & { newHolder: ResolversParentTypes['Account'], noun: ResolversParentTypes['Noun'], previousHolder: ResolversParentTypes['Account'] };
  TransferEvent_filter: TransferEvent_Filter;
  ValueWithSignature: ValueWithSignature;
  Vote: Omit<Vote, 'nouns' | 'proposal' | 'voter'> & { nouns?: Maybe<Array<ResolversParentTypes['Noun']>>, proposal: ResolversParentTypes['Proposal'], voter: ResolversParentTypes['Delegate'] };
  Vote_filter: Vote_Filter;
  WrappedDelegate: WrappedDelegateModel;
  WrappedDelegatesConnection: Omit<WrappedDelegatesConnection, 'edges'> & { edges: Array<ResolversParentTypes['WrappedDelegatesEdge']> };
  WrappedDelegatesEdge: Omit<WrappedDelegatesEdge, 'node'> & { node: ResolversParentTypes['WrappedDelegate'] };
  _Block_: _Block_;
  _Meta_: _Meta_;
};

export type DerivedFromDirectiveArgs = {
  field: Scalars['String'];
};

export type DerivedFromDirectiveResolver<Result, Parent, ContextType = AgoraContextType, Args = DerivedFromDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type EntityDirectiveArgs = { };

export type EntityDirectiveResolver<Result, Parent, ContextType = AgoraContextType, Args = EntityDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type SubgraphIdDirectiveArgs = {
  id: Scalars['String'];
};

export type SubgraphIdDirectiveResolver<Result, Parent, ContextType = AgoraContextType, Args = SubgraphIdDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type AccountResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['Account'] = ResolversParentTypes['Account']> = {
  address?: Resolver<ResolversTypes['Address'], ParentType, ContextType>;
  delegate?: Resolver<Maybe<ResolversTypes['Delegate']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  nouns?: Resolver<Array<ResolversTypes['Noun']>, ParentType, ContextType, RequireFields<AccountNounsArgs, 'first' | 'skip'>>;
  tokenBalance?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  tokenBalanceRaw?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  totalTokensHeld?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  totalTokensHeldRaw?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AddressResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['Address'] = ResolversParentTypes['Address']> = {
  account?: Resolver<Maybe<ResolversTypes['Account']>, ParentType, ContextType>;
  isContract?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  resolvedName?: Resolver<ResolversTypes['ResolvedName'], ParentType, ContextType>;
  wrappedDelegate?: Resolver<ResolversTypes['WrappedDelegate'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AuctionResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['Auction'] = ResolversParentTypes['Auction']> = {
  amount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  bidder?: Resolver<Maybe<ResolversTypes['Account']>, ParentType, ContextType>;
  bids?: Resolver<Array<ResolversTypes['Bid']>, ParentType, ContextType, RequireFields<AuctionBidsArgs, 'first' | 'skip'>>;
  endTime?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  noun?: Resolver<ResolversTypes['Noun'], ParentType, ContextType>;
  settled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BidResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['Bid'] = ResolversParentTypes['Bid']> = {
  amount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  auction?: Resolver<ResolversTypes['Auction'], ParentType, ContextType>;
  bidder?: Resolver<Maybe<ResolversTypes['Account']>, ParentType, ContextType>;
  blockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockTimestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  noun?: Resolver<ResolversTypes['Noun'], ParentType, ContextType>;
  txIndex?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface BigDecimalScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigDecimal'], any> {
  name: 'BigDecimal';
}

export interface BigIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigInt'], any> {
  name: 'BigInt';
}

export interface BytesScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Bytes'], any> {
  name: 'Bytes';
}

export type DelegateResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['Delegate'] = ResolversParentTypes['Delegate']> = {
  address?: Resolver<ResolversTypes['Address'], ParentType, ContextType>;
  delegatedVotes?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  delegatedVotesRaw?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  liquidRepresentation?: Resolver<Array<ResolversTypes['LiquidDelegationRepresentation']>, ParentType, ContextType>;
  nounsRepresented?: Resolver<Array<ResolversTypes['Noun']>, ParentType, ContextType, RequireFields<DelegateNounsRepresentedArgs, 'first' | 'skip'>>;
  propHouseVotes?: Resolver<Array<ResolversTypes['PropHouseRoundVotes']>, ParentType, ContextType>;
  proposals?: Resolver<Array<ResolversTypes['Proposal']>, ParentType, ContextType, RequireFields<DelegateProposalsArgs, 'first' | 'skip'>>;
  resolvedName?: Resolver<ResolversTypes['ResolvedName'], ParentType, ContextType>;
  tokenHoldersRepresented?: Resolver<Array<ResolversTypes['Account']>, ParentType, ContextType, RequireFields<DelegateTokenHoldersRepresentedArgs, 'first' | 'skip'>>;
  tokenHoldersRepresentedAmount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  voteSummary?: Resolver<ResolversTypes['DelegateVotesSummary'], ParentType, ContextType>;
  votes?: Resolver<Array<ResolversTypes['Vote']>, ParentType, ContextType, RequireFields<DelegateVotesArgs, 'first' | 'skip'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DelegateStatementResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['DelegateStatement'] = ResolversParentTypes['DelegateStatement']> = {
  discord?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  leastValuableProposals?: Resolver<Array<ResolversTypes['Proposal']>, ParentType, ContextType>;
  mostValuableProposals?: Resolver<Array<ResolversTypes['Proposal']>, ParentType, ContextType>;
  openToSponsoringProposals?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  statement?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  summary?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  topIssues?: Resolver<Array<ResolversTypes['TopIssue']>, ParentType, ContextType>;
  twitter?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DelegateVotesSummaryResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['DelegateVotesSummary'] = ResolversParentTypes['DelegateVotesSummary']> = {
  abstainVotes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  againstVotes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  forVotes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalVotes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DelegationEventResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['DelegationEvent'] = ResolversParentTypes['DelegationEvent']> = {
  blockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockTimestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  newDelegate?: Resolver<ResolversTypes['Delegate'], ParentType, ContextType>;
  noun?: Resolver<ResolversTypes['Noun'], ParentType, ContextType>;
  previousDelegate?: Resolver<ResolversTypes['Delegate'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GovernanceResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['Governance'] = ResolversParentTypes['Governance']> = {
  currentDelegates?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  currentTokenHolders?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  delegatedVotes?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  delegatedVotesRaw?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  proposals?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  proposalsQueued?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  totalDelegates?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  totalTokenHolders?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LiquidDelegationLotResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['LiquidDelegationLot'] = ResolversParentTypes['LiquidDelegationLot']> = {
  authorityChain?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  rules?: Resolver<Maybe<ResolversTypes['LiquidDelegationRules']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LiquidDelegationRepresentationResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['LiquidDelegationRepresentation'] = ResolversParentTypes['LiquidDelegationRepresentation']> = {
  delegate?: Resolver<ResolversTypes['Delegate'], ParentType, ContextType>;
  lots?: Resolver<Array<ResolversTypes['LiquidDelegationLot']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LiquidDelegationRulesResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['LiquidDelegationRules'] = ResolversParentTypes['LiquidDelegationRules']> = {
  blocksBeforeVoteCloses?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  customRules?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  permissionPropose?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  permissionSign?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  permissionVote?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  createNewDelegateStatement?: Resolver<ResolversTypes['WrappedDelegate'], ParentType, ContextType, Partial<MutationCreateNewDelegateStatementArgs>>;
};

export type NounResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['Noun'] = ResolversParentTypes['Noun']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Account'], ParentType, ContextType>;
  seed?: Resolver<Maybe<ResolversTypes['Seed']>, ParentType, ContextType>;
  votes?: Resolver<Array<ResolversTypes['Vote']>, ParentType, ContextType, RequireFields<NounVotesArgs, 'first' | 'skip'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OverallMetricsResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['OverallMetrics'] = ResolversParentTypes['OverallMetrics']> = {
  proposalThresholdBPS?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  quorumVotesBPS?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PageInfoResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  endCursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PropHouseProposalResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['PropHouseProposal'] = ResolversParentTypes['PropHouseProposal']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PropHouseRoundResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['PropHouseRound'] = ResolversParentTypes['PropHouseRound']> = {
  currencyType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fundingAmount?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PropHouseRoundVoteResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['PropHouseRoundVote'] = ResolversParentTypes['PropHouseRoundVote']> = {
  proposal?: Resolver<ResolversTypes['PropHouseProposal'], ParentType, ContextType>;
  weight?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PropHouseRoundVotesResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['PropHouseRoundVotes'] = ResolversParentTypes['PropHouseRoundVotes']> = {
  createdAt?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  round?: Resolver<ResolversTypes['PropHouseRound'], ParentType, ContextType>;
  votes?: Resolver<Array<ResolversTypes['PropHouseRoundVote']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProposalResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['Proposal'] = ResolversParentTypes['Proposal']> = {
  abstainVotes?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  actualStatus?: Resolver<ResolversTypes['ActualProposalStatus'], ParentType, ContextType>;
  againstVotes?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  calldatas?: Resolver<Maybe<Array<ResolversTypes['Bytes']>>, ParentType, ContextType>;
  createdBlock?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  createdBlockGovernance?: Resolver<ResolversTypes['Governance'], ParentType, ContextType>;
  createdTimestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  createdTransactionHash?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endBlock?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  executionETA?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  forVotes?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  proposalThreshold?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  proposer?: Resolver<ResolversTypes['Delegate'], ParentType, ContextType>;
  quorumVotes?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  signatures?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  startBlock?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ProposalStatus'], ParentType, ContextType>;
  targets?: Resolver<Maybe<Array<ResolversTypes['Bytes']>>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalValue?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  totalVotes?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  values?: Resolver<Maybe<Array<ResolversTypes['BigInt']>>, ParentType, ContextType>;
  voteEndsAt?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  voteStartsAt?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  votes?: Resolver<Array<ResolversTypes['Vote']>, ParentType, ContextType, RequireFields<ProposalVotesArgs, 'first' | 'skip'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _meta?: Resolver<Maybe<ResolversTypes['_Meta_']>, ParentType, ContextType, Partial<Query_MetaArgs>>;
  account?: Resolver<Maybe<ResolversTypes['Account']>, ParentType, ContextType, RequireFields<QueryAccountArgs, 'id' | 'subgraphError'>>;
  accounts?: Resolver<Array<ResolversTypes['Account']>, ParentType, ContextType, RequireFields<QueryAccountsArgs, 'first' | 'skip' | 'subgraphError'>>;
  address?: Resolver<Maybe<ResolversTypes['Address']>, ParentType, ContextType, RequireFields<QueryAddressArgs, 'addressOrEnsName'>>;
  auction?: Resolver<Maybe<ResolversTypes['Auction']>, ParentType, ContextType, RequireFields<QueryAuctionArgs, 'id' | 'subgraphError'>>;
  auctions?: Resolver<Array<ResolversTypes['Auction']>, ParentType, ContextType, RequireFields<QueryAuctionsArgs, 'first' | 'skip' | 'subgraphError'>>;
  bid?: Resolver<Maybe<ResolversTypes['Bid']>, ParentType, ContextType, RequireFields<QueryBidArgs, 'id' | 'subgraphError'>>;
  bids?: Resolver<Array<ResolversTypes['Bid']>, ParentType, ContextType, RequireFields<QueryBidsArgs, 'first' | 'skip' | 'subgraphError'>>;
  currentGovernance?: Resolver<ResolversTypes['Governance'], ParentType, ContextType>;
  delegate?: Resolver<Maybe<ResolversTypes['Delegate']>, ParentType, ContextType, RequireFields<QueryDelegateArgs, 'id' | 'subgraphError'>>;
  delegates?: Resolver<Array<ResolversTypes['Delegate']>, ParentType, ContextType, RequireFields<QueryDelegatesArgs, 'first' | 'skip' | 'subgraphError'>>;
  delegationEvent?: Resolver<Maybe<ResolversTypes['DelegationEvent']>, ParentType, ContextType, RequireFields<QueryDelegationEventArgs, 'id' | 'subgraphError'>>;
  delegationEvents?: Resolver<Array<ResolversTypes['DelegationEvent']>, ParentType, ContextType, RequireFields<QueryDelegationEventsArgs, 'first' | 'skip' | 'subgraphError'>>;
  governance?: Resolver<Maybe<ResolversTypes['Governance']>, ParentType, ContextType, RequireFields<QueryGovernanceArgs, 'id' | 'subgraphError'>>;
  governances?: Resolver<Array<ResolversTypes['Governance']>, ParentType, ContextType, RequireFields<QueryGovernancesArgs, 'first' | 'skip' | 'subgraphError'>>;
  metrics?: Resolver<ResolversTypes['OverallMetrics'], ParentType, ContextType>;
  noun?: Resolver<Maybe<ResolversTypes['Noun']>, ParentType, ContextType, RequireFields<QueryNounArgs, 'id' | 'subgraphError'>>;
  nouns?: Resolver<Array<ResolversTypes['Noun']>, ParentType, ContextType, RequireFields<QueryNounsArgs, 'first' | 'skip' | 'subgraphError'>>;
  proposal?: Resolver<Maybe<ResolversTypes['Proposal']>, ParentType, ContextType, RequireFields<QueryProposalArgs, 'id' | 'subgraphError'>>;
  proposals?: Resolver<Array<ResolversTypes['Proposal']>, ParentType, ContextType, RequireFields<QueryProposalsArgs, 'first' | 'skip' | 'subgraphError'>>;
  seed?: Resolver<Maybe<ResolversTypes['Seed']>, ParentType, ContextType, RequireFields<QuerySeedArgs, 'id' | 'subgraphError'>>;
  seeds?: Resolver<Array<ResolversTypes['Seed']>, ParentType, ContextType, RequireFields<QuerySeedsArgs, 'first' | 'skip' | 'subgraphError'>>;
  transferEvent?: Resolver<Maybe<ResolversTypes['TransferEvent']>, ParentType, ContextType, RequireFields<QueryTransferEventArgs, 'id' | 'subgraphError'>>;
  transferEvents?: Resolver<Array<ResolversTypes['TransferEvent']>, ParentType, ContextType, RequireFields<QueryTransferEventsArgs, 'first' | 'skip' | 'subgraphError'>>;
  vote?: Resolver<Maybe<ResolversTypes['Vote']>, ParentType, ContextType, RequireFields<QueryVoteArgs, 'id' | 'subgraphError'>>;
  votes?: Resolver<Array<ResolversTypes['Vote']>, ParentType, ContextType, RequireFields<QueryVotesArgs, 'first' | 'skip' | 'subgraphError'>>;
  wrappedDelegates?: Resolver<ResolversTypes['WrappedDelegatesConnection'], ParentType, ContextType, RequireFields<QueryWrappedDelegatesArgs, 'first' | 'orderBy'>>;
};

export type ResolvedNameResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['ResolvedName'] = ResolversParentTypes['ResolvedName']> = {
  address?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SeedResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['Seed'] = ResolversParentTypes['Seed']> = {
  accessory?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  background?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  body?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  glasses?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  head?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  _meta?: SubscriptionResolver<Maybe<ResolversTypes['_Meta_']>, "_meta", ParentType, ContextType, Partial<Subscription_MetaArgs>>;
  account?: SubscriptionResolver<Maybe<ResolversTypes['Account']>, "account", ParentType, ContextType, RequireFields<SubscriptionAccountArgs, 'id' | 'subgraphError'>>;
  accounts?: SubscriptionResolver<Array<ResolversTypes['Account']>, "accounts", ParentType, ContextType, RequireFields<SubscriptionAccountsArgs, 'first' | 'skip' | 'subgraphError'>>;
  auction?: SubscriptionResolver<Maybe<ResolversTypes['Auction']>, "auction", ParentType, ContextType, RequireFields<SubscriptionAuctionArgs, 'id' | 'subgraphError'>>;
  auctions?: SubscriptionResolver<Array<ResolversTypes['Auction']>, "auctions", ParentType, ContextType, RequireFields<SubscriptionAuctionsArgs, 'first' | 'skip' | 'subgraphError'>>;
  bid?: SubscriptionResolver<Maybe<ResolversTypes['Bid']>, "bid", ParentType, ContextType, RequireFields<SubscriptionBidArgs, 'id' | 'subgraphError'>>;
  bids?: SubscriptionResolver<Array<ResolversTypes['Bid']>, "bids", ParentType, ContextType, RequireFields<SubscriptionBidsArgs, 'first' | 'skip' | 'subgraphError'>>;
  delegate?: SubscriptionResolver<Maybe<ResolversTypes['Delegate']>, "delegate", ParentType, ContextType, RequireFields<SubscriptionDelegateArgs, 'id' | 'subgraphError'>>;
  delegates?: SubscriptionResolver<Array<ResolversTypes['Delegate']>, "delegates", ParentType, ContextType, RequireFields<SubscriptionDelegatesArgs, 'first' | 'skip' | 'subgraphError'>>;
  delegationEvent?: SubscriptionResolver<Maybe<ResolversTypes['DelegationEvent']>, "delegationEvent", ParentType, ContextType, RequireFields<SubscriptionDelegationEventArgs, 'id' | 'subgraphError'>>;
  delegationEvents?: SubscriptionResolver<Array<ResolversTypes['DelegationEvent']>, "delegationEvents", ParentType, ContextType, RequireFields<SubscriptionDelegationEventsArgs, 'first' | 'skip' | 'subgraphError'>>;
  governance?: SubscriptionResolver<Maybe<ResolversTypes['Governance']>, "governance", ParentType, ContextType, RequireFields<SubscriptionGovernanceArgs, 'id' | 'subgraphError'>>;
  governances?: SubscriptionResolver<Array<ResolversTypes['Governance']>, "governances", ParentType, ContextType, RequireFields<SubscriptionGovernancesArgs, 'first' | 'skip' | 'subgraphError'>>;
  noun?: SubscriptionResolver<Maybe<ResolversTypes['Noun']>, "noun", ParentType, ContextType, RequireFields<SubscriptionNounArgs, 'id' | 'subgraphError'>>;
  nouns?: SubscriptionResolver<Array<ResolversTypes['Noun']>, "nouns", ParentType, ContextType, RequireFields<SubscriptionNounsArgs, 'first' | 'skip' | 'subgraphError'>>;
  proposal?: SubscriptionResolver<Maybe<ResolversTypes['Proposal']>, "proposal", ParentType, ContextType, RequireFields<SubscriptionProposalArgs, 'id' | 'subgraphError'>>;
  proposals?: SubscriptionResolver<Array<ResolversTypes['Proposal']>, "proposals", ParentType, ContextType, RequireFields<SubscriptionProposalsArgs, 'first' | 'skip' | 'subgraphError'>>;
  seed?: SubscriptionResolver<Maybe<ResolversTypes['Seed']>, "seed", ParentType, ContextType, RequireFields<SubscriptionSeedArgs, 'id' | 'subgraphError'>>;
  seeds?: SubscriptionResolver<Array<ResolversTypes['Seed']>, "seeds", ParentType, ContextType, RequireFields<SubscriptionSeedsArgs, 'first' | 'skip' | 'subgraphError'>>;
  transferEvent?: SubscriptionResolver<Maybe<ResolversTypes['TransferEvent']>, "transferEvent", ParentType, ContextType, RequireFields<SubscriptionTransferEventArgs, 'id' | 'subgraphError'>>;
  transferEvents?: SubscriptionResolver<Array<ResolversTypes['TransferEvent']>, "transferEvents", ParentType, ContextType, RequireFields<SubscriptionTransferEventsArgs, 'first' | 'skip' | 'subgraphError'>>;
  vote?: SubscriptionResolver<Maybe<ResolversTypes['Vote']>, "vote", ParentType, ContextType, RequireFields<SubscriptionVoteArgs, 'id' | 'subgraphError'>>;
  votes?: SubscriptionResolver<Array<ResolversTypes['Vote']>, "votes", ParentType, ContextType, RequireFields<SubscriptionVotesArgs, 'first' | 'skip' | 'subgraphError'>>;
};

export type TopIssueResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['TopIssue'] = ResolversParentTypes['TopIssue']> = {
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransferEventResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['TransferEvent'] = ResolversParentTypes['TransferEvent']> = {
  blockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockTimestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  newHolder?: Resolver<ResolversTypes['Account'], ParentType, ContextType>;
  noun?: Resolver<ResolversTypes['Noun'], ParentType, ContextType>;
  previousHolder?: Resolver<ResolversTypes['Account'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VoteResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['Vote'] = ResolversParentTypes['Vote']> = {
  blockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  nouns?: Resolver<Maybe<Array<ResolversTypes['Noun']>>, ParentType, ContextType, RequireFields<VoteNounsArgs, 'first' | 'skip'>>;
  proposal?: Resolver<ResolversTypes['Proposal'], ParentType, ContextType>;
  reason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  support?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  supportDetailed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  voter?: Resolver<ResolversTypes['Delegate'], ParentType, ContextType>;
  votes?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  votesRaw?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WrappedDelegateResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['WrappedDelegate'] = ResolversParentTypes['WrappedDelegate']> = {
  address?: Resolver<ResolversTypes['Address'], ParentType, ContextType>;
  delegate?: Resolver<Maybe<ResolversTypes['Delegate']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  statement?: Resolver<Maybe<ResolversTypes['DelegateStatement']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WrappedDelegatesConnectionResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['WrappedDelegatesConnection'] = ResolversParentTypes['WrappedDelegatesConnection']> = {
  edges?: Resolver<Array<ResolversTypes['WrappedDelegatesEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WrappedDelegatesEdgeResolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['WrappedDelegatesEdge'] = ResolversParentTypes['WrappedDelegatesEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['WrappedDelegate'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type _Block_Resolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['_Block_'] = ResolversParentTypes['_Block_']> = {
  hash?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>;
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  timestamp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type _Meta_Resolvers<ContextType = AgoraContextType, ParentType extends ResolversParentTypes['_Meta_'] = ResolversParentTypes['_Meta_']> = {
  block?: Resolver<ResolversTypes['_Block_'], ParentType, ContextType>;
  deployment?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasIndexingErrors?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = AgoraContextType> = {
  Account?: AccountResolvers<ContextType>;
  Address?: AddressResolvers<ContextType>;
  Auction?: AuctionResolvers<ContextType>;
  Bid?: BidResolvers<ContextType>;
  BigDecimal?: GraphQLScalarType;
  BigInt?: GraphQLScalarType;
  Bytes?: GraphQLScalarType;
  Delegate?: DelegateResolvers<ContextType>;
  DelegateStatement?: DelegateStatementResolvers<ContextType>;
  DelegateVotesSummary?: DelegateVotesSummaryResolvers<ContextType>;
  DelegationEvent?: DelegationEventResolvers<ContextType>;
  Governance?: GovernanceResolvers<ContextType>;
  LiquidDelegationLot?: LiquidDelegationLotResolvers<ContextType>;
  LiquidDelegationRepresentation?: LiquidDelegationRepresentationResolvers<ContextType>;
  LiquidDelegationRules?: LiquidDelegationRulesResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Noun?: NounResolvers<ContextType>;
  OverallMetrics?: OverallMetricsResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  PropHouseProposal?: PropHouseProposalResolvers<ContextType>;
  PropHouseRound?: PropHouseRoundResolvers<ContextType>;
  PropHouseRoundVote?: PropHouseRoundVoteResolvers<ContextType>;
  PropHouseRoundVotes?: PropHouseRoundVotesResolvers<ContextType>;
  Proposal?: ProposalResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  ResolvedName?: ResolvedNameResolvers<ContextType>;
  Seed?: SeedResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  TopIssue?: TopIssueResolvers<ContextType>;
  TransferEvent?: TransferEventResolvers<ContextType>;
  Vote?: VoteResolvers<ContextType>;
  WrappedDelegate?: WrappedDelegateResolvers<ContextType>;
  WrappedDelegatesConnection?: WrappedDelegatesConnectionResolvers<ContextType>;
  WrappedDelegatesEdge?: WrappedDelegatesEdgeResolvers<ContextType>;
  _Block_?: _Block_Resolvers<ContextType>;
  _Meta_?: _Meta_Resolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = AgoraContextType> = {
  derivedFrom?: DerivedFromDirectiveResolver<any, any, ContextType>;
  entity?: EntityDirectiveResolver<any, any, ContextType>;
  subgraphId?: SubgraphIdDirectiveResolver<any, any, ContextType>;
};

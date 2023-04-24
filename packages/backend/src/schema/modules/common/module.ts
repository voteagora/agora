import { ethers } from "ethers";

import { createModule } from "../../../shared/schema/modules";
import { ReplaceContextAllResolvers } from "../../../shared/schema/helpers/replaceContextResolvers";
import { QuorumFetcherDeps } from "../../../shared/schema/context/quorumFetcher";
import { IVotesAggregate } from "../../../shared/contracts/indexers/IVotes/entities/aggregate";
import { Reader } from "../../../shared/indexer/storage/reader/type";
import { NameResolver } from "../../../shared/schema/context/nameResolver";

import typeDefs from "./schema.graphql";
import { CommonModule } from "./generated-types/module-types";
import { Address } from "./resolvers/Address";
import { ResolvedName } from "./resolvers/ResolvedName";
import { VotingPower } from "./resolvers/VotingPower";
import { BigIntScalarType } from "./resolvers/BigInt";
import { TimestampScalarType } from "./resolvers/Timestamp";
import { TokenAmount } from "./resolvers/TokenAmount";

type ResolversAssignable = ReplaceContextAllResolvers<
  CommonModule.Resolvers,
  Dependencies
>;

export type Resolvers = Required<ResolversAssignable>;

type Dependencies = {
  reader: Reader<{ IVotesAggregate: typeof IVotesAggregate }>;
  provider: ethers.providers.BaseProvider;
  nameResolver: NameResolver;
} & QuorumFetcherDeps;

const resolvers: ResolversAssignable = {
  Address,
  ResolvedName,
  VotingPower,
  BigInt: BigIntScalarType,
  Timestamp: TimestampScalarType,
  TokenAmount,
};

export const commonModule = createModule<Dependencies>({
  id: "common",
  resolvers,
  typeDefs,
});

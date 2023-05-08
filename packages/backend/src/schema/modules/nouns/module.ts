import { ReplaceContextAllResolvers } from "../../../shared/schema/helpers/replaceContextResolvers";
import { createModule } from "../../../shared/schema/modules";
import { Noun as NounEntity } from "../../../deployments/nouns/indexers/NounsToken/entities/noun";
import { IVotesAddress } from "../../../shared/contracts/indexers/ERC721Votes/entities/address";
import { IVotesAggregate } from "../../../shared/contracts/indexers/IVotes/entities/aggregate";
import { GovernorAggregates } from "../../../deployments/nouns/indexers/NounsDAO/entities/governorAggregates";
import { IGovernorProposal } from "../../../shared/contracts/indexers/IGovernor/entities/proposal";
import { Reader } from "../../../shared/indexer/storage/reader/type";
import { AccountLoader } from "../../context/accountLoader";
import { EntityRuntimeType } from "../../../shared/indexer/process/process";
import { IVotesAddressSnapshot } from "../../../shared/contracts/indexers/ERC721Votes/entities/addressSnapshot";
import { QuorumFetcher } from "../../../shared/schema/context/quorumFetcher";

import typeDefs from "./schema.graphql";
import { NounsModule } from "./generated-types/module-types";
import { Delegate } from "./resolvers/Delegate";
import { DelegateSnapshot } from "./resolvers/DelegateSnapshot";
import { Noun } from "./resolvers/Noun";
import { Query } from "./resolvers/Query";
import { Metrics } from "./resolvers/Metrics";

type Dependencies = {
  accountLoader: AccountLoader<EntityRuntimeType<typeof IVotesAddress>>;
  reader: Reader<{
    Noun: typeof NounEntity;
    GovernorAggregates: typeof GovernorAggregates;
    IVotesAddress: typeof IVotesAddress;
    IVotesAggregate: typeof IVotesAggregate;
    IGovernorProposal: typeof IGovernorProposal;
    IVotesAddressSnapshot: typeof IVotesAddressSnapshot;
  }>;
  quorumFetcher: QuorumFetcher;
};

type ResolversAssignable = ReplaceContextAllResolvers<
  NounsModule.Resolvers,
  Dependencies
>;

export type Resolvers = Required<ResolversAssignable>;

const resolvers: ResolversAssignable = {
  Metrics,
  Query,
  Noun,
  Delegate,
  DelegateSnapshot,
};

export const nounsModule = createModule<Dependencies>({
  id: "nouns",
  resolvers,
  typeDefs,
});

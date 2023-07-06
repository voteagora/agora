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
import { ErrorReporter } from "../../../shared/schema/helpers/nonFatalErrors";
import { PropHouseArgs } from "../propHouse/module";
import { LatestBlockFetcher } from "../../../shared/schema/context/latestBlockFetcher";
import { QuorumFetcher } from "../../../shared/schema/context/quorumFetcher";
import { NameResolver } from "../../../shared/schema/context/nameResolver";
import { alligatorEntityDefinitions } from "../../../shared/contracts/indexers/Alligator/entities/entities";
import { IGovernorEntities } from "../../../shared/contracts/indexers/IGovernor/entities";

import typeDefs from "./schema.graphql";
import { NounsModule } from "./generated-types/module-types";
import { Delegate } from "./resolvers/Delegate";
import { DelegateSnapshot } from "./resolvers/DelegateSnapshot";
import { Noun } from "./resolvers/Noun";
import { Query } from "./resolvers/Query";
import { Metrics } from "./resolvers/Metrics";
import { Proposal } from "./resolvers/Proposal";
import { OnChainProposalType } from "./resolvers/OnChainProposalType";
import { PropHouseProposalType } from "./resolvers/PropHouseProposalType";

type Dependencies = {
  accountLoader: AccountLoader<EntityRuntimeType<typeof IVotesAddress>>;
  errorReporter: ErrorReporter;
  propHouse: PropHouseArgs;
  latestBlockFetcher: LatestBlockFetcher;

  reader: Reader<
    typeof alligatorEntityDefinitions &
      typeof IGovernorEntities & {
        Noun: typeof NounEntity;
        GovernorAggregates: typeof GovernorAggregates;
        IVotesAddress: typeof IVotesAddress;
        IGovernorProposal: typeof IGovernorProposal;
        IVotesAddressSnapshot: typeof IVotesAddressSnapshot;
      }
  >;
  quorumFetcher: QuorumFetcher;
  nameResolver: NameResolver;
};

type ResolversAssignable = ReplaceContextAllResolvers<
  NounsModule.Resolvers,
  Dependencies
>;

export type Resolvers = Required<ResolversAssignable>;

const resolvers: ResolversAssignable = {
  Metrics,
  Query,

  // @ts-ignore
  Proposal,
  PropHouseProposalType,
  OnChainProposalType,
  Noun,
  Delegate,
  DelegateSnapshot,
};

export const nounsModule = createModule<Dependencies>({
  id: "nouns",
  resolvers,
  typeDefs,
});

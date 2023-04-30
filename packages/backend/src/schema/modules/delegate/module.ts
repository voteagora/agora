import { ethers } from "ethers";

import { createModule } from "../../../shared/schema/modules";
import { ReplaceContextAllResolvers } from "../../../shared/schema/helpers/replaceContextResolvers";
import { IGovernorEntities } from "../../../shared/contracts/indexers/IGovernor/entities";
import { erc721EntityDefinitions } from "../../../shared/contracts/indexers/ERC721Votes/entities";
import { LatestBlockFetcher } from "../../../shared/schema/context/latestBlockFetcher";
import { NameResolver } from "../../../shared/schema/context/nameResolver";
import { Reader } from "../../../shared/indexer/storage/reader/type";
import { IVotesAddress } from "../../../shared/contracts/indexers/ERC721Votes/entities/address";
import { AccountLoader } from "../../context/accountLoader";
import { EntityRuntimeType } from "../../../shared/indexer/process/process";
import { QuorumFetcher } from "../../../shared/schema/context/quorumFetcher";
import { DelegatesLoader } from "../context/delegatesLoader";

import typeDefs from "./schema.graphql";
import { DelegateModule } from "./generated-types/module-types";
import { Query } from "./resolvers/Query";
import { Delegate } from "./resolvers/Delegate";
import { Proposal } from "./resolvers/Proposal";
import { ProposalTransaction } from "./resolvers/ProposalTransaction";
import { Vote } from "./resolvers/Vote";

type Dependencies = {
  reader: Reader<
    typeof IGovernorEntities &
      Pick<typeof erc721EntityDefinitions, "IVotesAddress">
  >;
  accountLoader: AccountLoader<EntityRuntimeType<typeof IVotesAddress>>;
  latestBlockFetcher: LatestBlockFetcher;
  quorumFetcher: QuorumFetcher;
  nameResolver: NameResolver;
  delegatesLoader: DelegatesLoader;
};

type ResolversAssignable = ReplaceContextAllResolvers<
  DelegateModule.Resolvers,
  Dependencies
>;

export type Resolvers = Required<ResolversAssignable>;

const resolvers: ResolversAssignable = {
  Query,
  Delegate,
  Proposal,
  ProposalTransaction,
  Vote,
};

export const delegateModule = createModule<Dependencies>({
  id: "delegate",
  resolvers,
  typeDefs,
});

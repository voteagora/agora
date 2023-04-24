import { ethers } from "ethers";
import { Address } from "viem";

import { createModule } from "../../../shared/schema/modules";
import { LatestBlockFetcher } from "../../../shared/schema/context/latestBlockFetcher";
import { ReplaceContextAllResolvers } from "../../../shared/schema/helpers/replaceContextResolvers";
import { alligatorEntityDefinitions } from "../../../shared/contracts/indexers/Alligator/entities/entities";
import { IVotesAddress } from "../../../shared/contracts/indexers/ERC721Votes/entities/address";
import { IGovernorProposal } from "../../../shared/contracts/indexers/IGovernor/entities/proposal";
import { Reader } from "../../../shared/indexer/storage/reader/type";

import typeDefs from "./schema.graphql";
import { LiquidDelegationModule } from "./generated-types/module-types";
import { LiquidDelegationDelegation } from "./resolvers/LiquidDelegationDelegation";
import { LiquidDelegationProxy } from "./resolvers/LiquidDelegationProxy";
import { LiquidDelegationRepresentation } from "./resolvers/LiquidDelegationRepresentation";
import { LiquidDelegationRules } from "./resolvers/LiquidDelegationRules";
import { Delegate } from "./resolvers/Delegate";

type Dependencies = {
  reader: Reader<
    typeof alligatorEntityDefinitions & {
      IVotesAddress: typeof IVotesAddress;
      IGovernorProposal: typeof IGovernorProposal;
    }
  >;
  latestBlockFetcher: LatestBlockFetcher;
  provider: ethers.providers.BaseProvider;
  liquidDelegation: LiquidDelegationArgs;
};

type LiquidDelegationArgs = {
  daoContract: Address;
};

type ResolversAssignable = ReplaceContextAllResolvers<
  LiquidDelegationModule.Resolvers,
  Dependencies
>;

export type Resolvers = Required<ResolversAssignable>;

const resolvers: ResolversAssignable = {
  Delegate,
  LiquidDelegationDelegation,
  LiquidDelegationProxy,
  LiquidDelegationRepresentation,
  LiquidDelegationRules,
};

export const liquidDelegationModule = createModule<Dependencies>({
  id: "liquidDelegation",
  resolvers,
  typeDefs,
});

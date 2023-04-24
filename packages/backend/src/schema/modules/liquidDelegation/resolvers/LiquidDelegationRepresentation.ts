import { ResolvedLiquidDelegatedVotesLot } from "../../../../shared/contracts/indexers/Alligator/entities/lots";
import { Resolvers } from "../module";

export type LiquidDelegationRepresentationModel = {
  proxy: string;
  owner: string;
  lots: ResolvedLiquidDelegatedVotesLot[];
};

export const LiquidDelegationRepresentation: Resolvers["LiquidDelegationRepresentation"] =
  {
    async proxy({ proxy }, _args, { reader }) {
      return {
        address: proxy,
      };
    },

    async owner({ owner }, _args, { reader }) {
      return {
        address: owner,
      };
    },
  };

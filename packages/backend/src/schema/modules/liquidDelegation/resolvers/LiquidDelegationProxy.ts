import { RuntimeType } from "../../../../shared/indexer/serde";
import { alligatorEntityDefinitions } from "../../../../shared/contracts/indexers/Alligator/entities/entities";
import { Resolvers } from "../module";

export type LiquidDelegationProxyModel = RuntimeType<
  typeof alligatorEntityDefinitions["AlligatorProxy"]["serde"]
>;

export const LiquidDelegationProxy: Resolvers["LiquidDelegationProxy"] = {
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

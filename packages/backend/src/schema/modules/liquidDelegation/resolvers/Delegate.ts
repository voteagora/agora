import { Alligator__factory } from "@agora/common/src/contracts/generated";
import { nounsAlligator } from "@agora/common";
import { groupBy } from "lodash";
import { Address } from "viem";

import {
  collectGenerator,
  flatMapGenerator,
} from "../../../../shared/utils/generatorUtils";
import { Resolvers } from "../module";
import {
  delegatedToLots,
  ResolvedLiquidDelegatedVotesLot,
  resolveLot,
  subDelegationsFrom,
} from "../../../../shared/contracts/indexers/Alligator/entities/lots";
import { calculateResolvedRules } from "../../../../shared/contracts/indexers/Alligator/entities/resolvedRules";
import {
  filterCurrentlyActive,
  filterForProposal,
  filterPermissions,
} from "../../../../shared/contracts/indexers/Alligator/entities/filterLots";
import { sortParamsForDelegate } from "../../../../deployments/nouns/delegatesLoader";

import { LiquidDelegationRepresentationModel } from "./LiquidDelegationRepresentation";

export const Delegate: Resolvers["Delegate"] = {
  async liquidDelegations({ address }, _args, { reader }) {
    return await collectGenerator(
      flatMapGenerator(
        subDelegationsFrom(reader, address),
        async function* (it) {
          const rules = calculateResolvedRules([it.rules]);

          if (rules.permissions === 0) {
            return;
          }

          yield {
            to: it.to,
            rules,
          };
        }
      )
    );
  },

  async liquidRepresentation(
    { address },
    { filter },
    { reader, latestBlockFetcher, provider, liquidDelegation: { daoContract } }
  ) {
    const now = new Date();
    const lots = await collectGenerator(
      flatMapGenerator(
        delegatedToLots(reader, address),
        async function* (unresolvedLot) {
          const lot = resolveLot(unresolvedLot);

          if (!filterPermissions(filter, lot)) {
            return;
          }

          if (!filterCurrentlyActive(filter, lot, now)) {
            return;
          }

          if (
            !(await filterForProposal(
              filter,
              lot,
              daoContract,
              address as Address,
              provider,
              latestBlockFetcher,
              reader
            ))
          ) {
            return;
          }

          yield lot;
        }
      )
    );

    return toLiquidRepresentations(lots);
  },

  async liquidDelegationProxy({ address }, _args, { reader }) {
    return await reader.getEntity("AlligatorProxy", address);
  },

  async liquidDelegationProxyAddress({ address }, _args, { provider }) {
    const alligator = Alligator__factory.connect(
      nounsAlligator.address,
      provider
    );
    const proxyAddress = await alligator.proxyAddress(address);

    return {
      address: proxyAddress,
    };
  },

  async totalTokensRepresented({ address }, _args, { reader }) {
    const item = await sortParamsForDelegate(address, new Date(), reader);

    return item.tokensRepresented;
  },
};

function toLiquidRepresentations(
  lots: ResolvedLiquidDelegatedVotesLot[]
): LiquidDelegationRepresentationModel[] {
  return Object.entries(groupBy(lots, (it) => it.proxy)).map(
    ([proxy, lots]) => {
      return {
        proxy,
        owner: lots[0].owner,
        lots: lots,
      };
    }
  );
}

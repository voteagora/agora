import { groupBy } from "lodash";

import {
  collectGenerator,
  flatMapGenerator,
} from "../../../indexer/utils/generatorUtils";
import {
  DelegateResolvers,
  LiquidDelegationDelegationResolvers,
  LiquidDelegationProxyResolvers,
  LiquidDelegationRepresentationResolvers,
  LiquidDelegationRulesResolvers,
} from "../generated/types";

import { defaultAccount } from "../../../indexer/contracts/NounsToken";
import { Alligator__factory } from "../../../contracts/generated";
import { alligatorContract } from "../../../indexer/contracts/Alligator";
import { RuntimeType } from "../../../indexer/serde";
import { entityDefinitions } from "../../../indexer/contracts/entityDefinitions";

import {
  calculateResolvedRules,
  checkBlocksBeforeVoteCloses,
  checkCustomRule,
  checkTimePermission,
  PERMISSION_PROPOSE,
  PERMISSION_SIGN,
  PERMISSION_VOTE,
  ResolvedRules,
} from "./rules";
import {
  delegatedToLots,
  ResolvedLiquidDelegatedVotesLot,
  resolveLot,
  subDelegationsFrom,
} from "./lots";

export const Delegate: DelegateResolvers = {
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
    { reader, latestBlockFetcher, ethProvider }
  ) {
    const now = new Date();
    const lots = await collectGenerator(
      flatMapGenerator(
        delegatedToLots(reader, address),
        async function* (unresolvedLot) {
          const lot = resolveLot(unresolvedLot);

          if (lot.rules.permissions === 0) {
            return;
          }

          if (filter.canSign && !(lot.rules.permissions & PERMISSION_SIGN)) {
            return;
          }

          if (filter.canVote && !(lot.rules.permissions & PERMISSION_VOTE)) {
            return;
          }

          if (
            filter.canPropose &&
            !(lot.rules.permissions & PERMISSION_PROPOSE)
          ) {
            return;
          }

          if (filter.currentlyActive && !checkTimePermission(lot.rules, now)) {
            return;
          }

          if (filter.forProposal) {
            const proposal = await reader.getEntity(
              "Proposal",
              filter.forProposal.proposalId.toString()
            );
            if (!proposal) {
              throw new Error("invalid proposal id");
            }

            const latestBlock = await latestBlockFetcher.getLatestBlock();

            if (
              !(await checkBlocksBeforeVoteCloses(
                lot.rules,
                proposal,
                latestBlock.number
              ))
            ) {
              return;
            }

            if (filter.forProposal.support) {
              for (const customRule of lot.rules.customRules) {
                const isValid = await checkCustomRule(
                  customRule,
                  address,
                  proposal.proposalId,
                  filter.forProposal.support,
                  ethProvider
                );

                if (!isValid) {
                  return;
                }
              }
            }
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

  async liquidDelegationProxyAddress({ address }, _args, { ethProvider }) {
    const alligator = Alligator__factory.connect(
      alligatorContract.address,
      ethProvider
    );
    const proxyAddress = await alligator.proxyAddress(address);

    return {
      address: proxyAddress,
    };
  },
};

export type LiquidDelegationProxyModel = RuntimeType<
  typeof entityDefinitions["AlligatorProxy"]["serde"]
>;

export const LiquidDelegationProxy: LiquidDelegationProxyResolvers = {
  async proxy({ proxy }, _args, { reader }) {
    return (await reader.getEntity("Address", proxy)) ?? defaultAccount(proxy);
  },

  async owner({ owner }, _args, { reader }) {
    return (await reader.getEntity("Address", owner)) ?? defaultAccount(owner);
  },
};

export type LiquidDelegationRepresentationModel = {
  proxy: string;
  owner: string;
  lots: ResolvedLiquidDelegatedVotesLot[];
};

export const LiquidDelegationRepresentation: LiquidDelegationRepresentationResolvers =
  {
    async proxy({ proxy }, _args, { reader }) {
      return (
        (await reader.getEntity("Address", proxy)) ?? defaultAccount(proxy)
      );
    },

    async owner({ owner }, _args, { reader }) {
      return (
        (await reader.getEntity("Address", owner)) ?? defaultAccount(owner)
      );
    },
  };

export type LiquidDelegationDelegationModel = {
  to: string;
  rules: ResolvedRules;
};

export const LiquidDelegationDelegation: LiquidDelegationDelegationResolvers = {
  to({ to }) {
    return { address: to };
  },
};

export type LiquidDelegationRulesModel = ResolvedRules;

export const LiquidDelegationRules: LiquidDelegationRulesResolvers = {
  permissionVote({ permissions }) {
    return !!(permissions & PERMISSION_VOTE);
  },

  permissionSign({ permissions }) {
    return !!(permissions & PERMISSION_SIGN);
  },

  permissionPropose({ permissions }) {
    return !!(permissions & PERMISSION_PROPOSE);
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

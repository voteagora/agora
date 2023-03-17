import { exactIndexValue, Reader } from "../../../indexer/storage/reader";
import { entityDefinitions } from "../../../indexer/contracts/entityDefinitions";

import { calculateResolvedRules, ResolvedRules, Rules } from "./rules";

export type LiquidDelegatedVotesLot = {
  owner: string;
  proxy: string;

  /**
   * A list of addresses starting with the address of the owner of the proxy
   * and ending with a liquid actor.
   */
  authorityChain: AuthorityChainEntry[];
};

export type AuthorityChainEntry = {
  address: string;
  rules: Rules | null;
};

/**
 * Finds all liquid delegation lots delegated to the specified address.
 */
export async function* delegatedToLots(
  reader: Reader<typeof entityDefinitions>,
  to: string,
  visited: Set<string> = new Set()
): AsyncGenerator<LiquidDelegatedVotesLot> {
  if (visited.has(to)) {
    return;
  }

  visited.add(to);

  for await (const { value: alligatorProxy } of reader.getEntitiesByIndex(
    "AlligatorProxy",
    "byOwner",
    exactIndexValue(to)
  )) {
    yield {
      owner: alligatorProxy.owner,
      proxy: alligatorProxy.proxy,
      authorityChain: [
        {
          address: alligatorProxy.owner,
          rules: null,
        },
      ],
    };
  }

  for await (const { value: subDelegation } of reader.getEntitiesByIndex(
    "AlligatorSubDelegation",
    "byTo",
    exactIndexValue(to)
  )) {
    for await (const lot of delegatedToLots(
      reader,
      subDelegation.from,
      visited
    )) {
      yield {
        owner: lot.owner,
        proxy: lot.proxy,
        authorityChain: [
          ...lot.authorityChain,
          {
            rules: subDelegation.rules,
            address: subDelegation.to,
          },
        ],
      };
    }
  }
}

/**
 * Finds all outgoing subdelegations from {@link from}.
 */
export async function* subDelegationsFrom(
  reader: Reader<typeof entityDefinitions>,
  from: string
) {
  for await (const { value } of reader.getEntitiesByIndex(
    "AlligatorSubDelegation",
    "byFrom",
    exactIndexValue(from)
  )) {
    yield {
      to: value.to,
      rules: value.rules,
    };
  }
}

export type ResolvedLiquidDelegatedVotesLot = {
  proxy: string;
  owner: string;
  authorityChain: string[];
  rules: ResolvedRules;
};

export function resolveLot(
  lot: LiquidDelegatedVotesLot
): ResolvedLiquidDelegatedVotesLot {
  return {
    proxy: lot.proxy,
    owner: lot.owner,
    authorityChain: lot.authorityChain.map((it) => it.address),
    rules: calculateResolvedRules(lot.authorityChain.map((it) => it.rules)),
  };
}

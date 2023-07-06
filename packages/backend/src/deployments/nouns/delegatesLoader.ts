import { flipComparator } from "@agora/frontend/src/utils/sorting";

import { IVotesAddress } from "../../shared/contracts/indexers/ERC721Votes/entities/address";
import { Reader } from "../../shared/indexer/storage/reader/type";
import { DelegatesLoader } from "../../schema/context/delegatesLoader";
import { alligatorEntityDefinitions } from "../../shared/contracts/indexers/Alligator/entities/entities";
import {
  collectGenerator,
  concatGenerators,
  flatMapGenerator,
  groupBy,
  limitGenerator,
  mapGenerator,
  reduceGenerator,
  uniqueItems,
} from "../../shared/utils/generatorUtils";
import {
  delegatedToLots,
  resolveLot,
} from "../../shared/contracts/indexers/Alligator/entities/lots";
import { filterCurrentlyActive } from "../../shared/contracts/indexers/Alligator/entities/filterLots";
import { compareBy } from "../../shared/utils/sortUtils";
import { paginateArray } from "../../shared/schema/pagination";

/**
 * Loads delegates, sorted by the given order including voting power from
 * liquid delegation. Calculates voting power at read time. This is probably
 * fine for nouns since the user counts are small but will fall apart quickly
 * past 1k users.
 */
export function makeLiquidDelegationDelegatesLoader(
  reader: Reader<
    { IVotesAddress: typeof IVotesAddress } & typeof alligatorEntityDefinitions
  >
): DelegatesLoader {
  return {
    async loadDelegates({ after, first, orderBy }) {
      const liquidDelegationAddresses = mapGenerator(
        groupBy(
          reader.getEntitiesByIndex("AlligatorSubDelegation", "byTo", {}),
          (it) => it.value.to
        ),
        (it) => it[0].value.to
      );

      const tokenDelegationAddresses = mapGenerator(
        limitGenerator(
          reader.getEntitiesByIndex("IVotesAddress", "byTokensRepresented", {}),
          100
        ),
        (it) => it.value.address
      );

      const delegationAddresses = uniqueItems(
        concatGenerators(liquidDelegationAddresses, tokenDelegationAddresses)
      );

      const now = new Date();

      const itemsToSortGenerator = flatMapGenerator(
        delegationAddresses,
        async function* (address) {
          yield sortParamsForDelegate(address, now, reader);
        }
      );

      const items = await collectGenerator(itemsToSortGenerator);

      const sortedItems = items.slice().sort(
        (() => {
          switch (orderBy) {
            case "mostVotingPower":
              return flipComparator(compareBy((it) => it.tokensRepresented));

            case "mostDelegates":
              return flipComparator(compareBy((it) => it.accountsRepresented));

            case "mostVotesCast":
              return flipComparator(compareBy((it) => it.votesCast));

            case "leastVotesCast":
              return flipComparator(compareBy((it) => it.votesCast * -1n));
          }
        })()
      );

      return paginateArray(sortedItems, first, after);
    },
  };
}

export async function sortParamsForDelegate(
  address: string,
  now: Date,
  reader: Reader<
    { IVotesAddress: typeof IVotesAddress } & typeof alligatorEntityDefinitions
  >
) {
  const liquidDelegationComparatorValues = await (async () => {
    const liquidDelegationLots = flatMapGenerator(
      // todo: memoize this part of the calculation
      delegatedToLots(reader, address),
      async function* (unresolvedLot) {
        const lot = resolveLot(unresolvedLot);

        if (!filterCurrentlyActive({ currentlyActive: true }, lot, now)) {
          return;
        }

        const proxyAddress = await reader.getEntity("IVotesAddress", lot.proxy);

        if (!proxyAddress) {
          return;
        }

        yield {
          tokensRepresented: proxyAddress.tokensRepresented,
          accountsRepresented: proxyAddress.accountsRepresentedCount,
          votesCast: proxyAddress.votesCast,
        };
      }
    );

    return await reduceGenerator(
      liquidDelegationLots,
      (acc, it) => ({
        tokensRepresented: it.tokensRepresented + acc.tokensRepresented,
        accountsRepresented: it.accountsRepresented + acc.accountsRepresented,
        votesCast: it.votesCast + acc.votesCast,
      }),
      {
        tokensRepresented: 0n,
        accountsRepresented: 0n,
        votesCast: 0n,
      }
    );
  })();

  const tokenDelegationComparatorValues = await (async () => {
    const delegate = await reader.getEntity("IVotesAddress", address);

    return {
      tokensRepresented: delegate?.tokensRepresented ?? 0n,
      accountsRepresented: delegate?.accountsRepresentedCount ?? 0n,
      votesCast: delegate?.votesCast ?? 0n,
    };
  })();

  return {
    address,
    tokensRepresented:
      liquidDelegationComparatorValues.tokensRepresented +
      tokenDelegationComparatorValues.tokensRepresented,
    accountsRepresented:
      liquidDelegationComparatorValues.accountsRepresented +
      tokenDelegationComparatorValues.accountsRepresented,
    votesCast:
      liquidDelegationComparatorValues.votesCast +
      tokenDelegationComparatorValues.votesCast,
  };
}

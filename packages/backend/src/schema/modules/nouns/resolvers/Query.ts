import { flipComparator } from "@agora/frontend/src/utils/sorting";

import { Resolvers } from "../module";
import { fetchAuctions } from "../../propHouse/api/fetchAuctions";
import { compareBy } from "../../../../shared/utils/sortUtils";
import {
  asyncIterableFromIterable,
  collectGenerator,
  filterGenerator,
  mapGenerator,
  mergeGenerators,
  optimisticGenerator,
} from "../../../../shared/utils/generatorUtils";
import { approximateTimeStampForBlock } from "../../../../shared/utils/blockTimestamp";
import { paginateGenerator } from "../../../../shared/schema/pagination";
import {
  proposalStatus,
  needsToVote,
} from "../../../../shared/contracts/indexers/IGovernor/entities/proposal";
import { needsToVoteOnPropHouse } from "../../propHouse/resolvers/PropHouseAuction";

import { ProposalModel } from "./Proposal";

export const Query: Resolvers["Query"] = {
  async proposals(
    _,
    { first, after, where, orderBy },
    { errorReporter, propHouse: { communityId }, reader, latestBlockFetcher }
  ) {
    const propHouseProposals = await (async () => {
      try {
        return await fetchAuctions({
          communityId,
        });
      } catch (e) {
        errorReporter.captureException(e);
        return [];
      }
    })();

    const sortedPropHouseProposals = propHouseProposals.sort(
      (() => {
        switch (orderBy) {
          case "byStartTimeDesc":
            return flipComparator(compareBy((it) => +new Date(it.startTime)));
        }
      })()
    );

    const sortedOnChainProposals = reader.getEntitiesByIndex(
      "IGovernorProposal",
      (() => {
        switch (orderBy) {
          case "byStartTimeDesc":
            return "byEndBlock" as const;
        }
      })(),
      {}
    );

    const latestBlock = await latestBlockFetcher.getLatestBlock();

    const sortedGenerator = mergeGenerators<ProposalModel>(
      [
        mapGenerator(
          asyncIterableFromIterable(sortedPropHouseProposals),
          (auction) => ({ type: "PROP_HOUSE" as const, auction })
        ),
        mapGenerator(sortedOnChainProposals, (proposal) => ({
          type: "ON_CHAIN" as const,
          proposal,
        })),
      ],
      (() => {
        switch (orderBy) {
          case "byStartTimeDesc":
            return flipComparator(
              compareBy((it) => {
                switch (it.type) {
                  case "ON_CHAIN": {
                    return approximateTimeStampForBlock(
                      Number(it.proposal.value.startBlock),
                      latestBlock
                    ).valueOf();
                  }

                  case "PROP_HOUSE": {
                    return new Date(it.auction.startTime).valueOf();
                  }
                }
              })
            );
        }
      })()
    );

    return await paginateGenerator(sortedGenerator, first, after ?? null);
  },

  async nonVotedProposals(
    _,
    { addressOrEnsName },
    {
      errorReporter,
      propHouse: { communityId },
      reader,
      nameResolver,
      latestBlockFetcher,
    }
  ) {
    const address = await nameResolver.resolveAddress(addressOrEnsName);

    if (!address) {
      return [];
    }

    const latestBlock = await latestBlockFetcher.getLatestBlock();

    const sortedOnChainProposals = filterGenerator(
      optimisticGenerator(
        reader.getEntitiesByIndex("IGovernorProposal", "byEndBlock", {}),
        (it) => it.value.endBlock <= latestBlock.number
      ),
      async (it) => {
        if (address) {
          return await needsToVote(
            address,
            it.value,
            reader,
            latestBlock.number
          );
        }

        return false;
      }
    );

    const propHouseProposals = await (async () => {
      try {
        return await fetchAuctions({
          communityId,
        });
      } catch (e) {
        errorReporter.captureException(e);
        return [];
      }
    })();

    const filteredPropHouseProposals = (
      await Promise.all(
        propHouseProposals.flatMap(async (it) => {
          const shouldInclude = await needsToVoteOnPropHouse(
            address,
            reader,
            it
          );
          return shouldInclude ? [it] : [];
        })
      )
    ).flatMap((it) => it);

    const sortedPropHouseProposals = filteredPropHouseProposals.sort(
      (() => {
        return flipComparator(compareBy((it) => +new Date(it.startTime)));
      })()
    );

    return await collectGenerator(
      mergeGenerators<ProposalModel>(
        [
          mapGenerator(
            asyncIterableFromIterable(sortedPropHouseProposals),
            (auction) => ({ type: "PROP_HOUSE" as const, auction })
          ),
          mapGenerator(sortedOnChainProposals, (proposal) => ({
            type: "ON_CHAIN" as const,
            proposal,
          })),
        ],
        (() => {
          return flipComparator(
            compareBy((it) => {
              switch (it.type) {
                case "ON_CHAIN": {
                  return approximateTimeStampForBlock(
                    Number(it.proposal.value.startBlock),
                    latestBlock
                  ).valueOf();
                }

                case "PROP_HOUSE": {
                  return new Date(it.auction.startTime).valueOf();
                }
              }
            })
          );
        })()
      )
    );
  },

  metrics() {
    return {};
  },
};

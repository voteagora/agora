import { BigNumber } from "ethers";

import {
  collectGenerator,
  limitGenerator,
} from "../../../../shared/utils/generatorUtils";
import {
  IVotesAggregate,
  loadAggregate,
} from "../../../../shared/contracts/indexers/IVotes/entities/aggregate";
import { loadGovernanceAggregate } from "../../../../deployments/nouns/indexers/NounsDAO/entities/governorAggregates";
import { Resolvers } from "../module";
import { EntityRuntimeType } from "../../../../shared/indexer/process/process";

export type MetricsModel = {};

export const Metrics: Resolvers["Metrics"] = {
  async delegatedSupply(_parent, _args, { reader }) {
    const aggregate = await loadAggregate(reader);
    return aggregate.delegatedSupply;
  },
  async totalSupply(_parent, _args, { reader }) {
    const aggregate = await loadAggregate(reader);
    return aggregate.totalSupply;
  },

  async quorumFloor(_parent, _args, { reader }) {
    const govAgg = await loadGovernanceAggregate(reader);
    const agg = await loadAggregate(reader);
    return bpsOfSupply(govAgg.quorumFloorBps, agg);
  },

  async quorumCeiling(_parent, _args, { reader }) {
    const govAgg = await loadGovernanceAggregate(reader);
    const agg = await loadAggregate(reader);
    return bpsOfSupply(govAgg.quorumCeilingBps, agg);
  },

  async ownersCount(_parent, _args, { reader }) {
    return (await loadAggregate(reader)).totalOwners;
  },

  async proposalThreshold(_parents, _args, { reader }) {
    const govAgg = await loadGovernanceAggregate(reader);
    const agg = await loadAggregate(reader);
    return bpsOfSupply(Number(govAgg.proposalThresholdBps), agg) + 1n;
  },

  async delegatesCount(_parents, _args, { reader }) {
    return (await loadAggregate(reader)).totalDelegates;
  },

  async recentVoterTurnoutBps(_parents, _args, { reader }) {
    const counts = await collectGenerator(
      limitGenerator(
        (async function* () {
          for await (const { value: proposal } of reader.getEntitiesByIndex(
            "IGovernorProposal",
            "byEndBlock",
            {}
          )) {
            const totalVotesCount =
              proposal.aggregates.abstainVotes +
              proposal.aggregates.forVotes +
              proposal.aggregates.againstVotes;
            if (totalVotesCount === 0n) {
              continue;
            }

            yield (totalVotesCount * (100n * 100n)) /
              proposal.snapshot.totalSupply;
          }
        })(),
        40
      )
    );

    const total = counts.reduce(
      (acc, item) => acc.add(item),
      BigNumber.from(0)
    );

    if (!counts.length) {
      return 0;
    }

    return total.div(counts.length).toNumber();
  },
};

function bpsOfSupply(
  bps: number,
  aggregate: EntityRuntimeType<typeof IVotesAggregate>
) {
  return (aggregate.totalSupply * BigInt(bps)) / (100n * 100n);
}

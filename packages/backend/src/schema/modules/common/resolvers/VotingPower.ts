import { loadAggregate } from "../../../../shared/contracts/indexers/IVotes/entities/aggregate";
import { Resolvers } from "../module";
import { asBps } from "../../../../utils/bps";

export type VotingPowerModel = bigint;

export const VotingPower: Resolvers["VotingPower"] = {
  amount(value) {
    return value;
  },

  async bpsOfTotal(value, _args, { reader }) {
    const aggregate = await loadAggregate(reader);

    return asBps(value, aggregate.totalSupply);
  },

  async bpsOfDelegatedSupply(value, _args, { reader }) {
    const aggregate = await loadAggregate(reader);

    return asBps(value, aggregate.delegatedSupply);
  },

  async bpsOfQuorum(value, _args, { quorumFetcher }) {
    const quorum = await quorumFetcher.fetchQuorum();
    return asBps(value, quorum);
  },
};

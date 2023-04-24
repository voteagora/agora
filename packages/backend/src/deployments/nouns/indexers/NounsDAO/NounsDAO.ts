import { nounsDao } from "@agora/common";

import { makeIndexerDefinition } from "../../../../shared/indexer";
import { intoContractInstance } from "../../../../shared/indexer/process/contractInstance";
import { makeGovernorIndexer } from "../../../../shared/contracts/indexers/IGovernor/IGovernor";
import { IGovernorEntities } from "../../../../shared/contracts/indexers/IGovernor/entities";

import {
  GovernorAggregates,
  loadGovernanceAggregate,
  saveGovernanceAggregate,
} from "./entities/governorAggregates";

export const daoContract = intoContractInstance(nounsDao);

export const governorIndexer = (() => {
  const sharedIndexer = makeGovernorIndexer(daoContract, "NounsDAO");

  return makeIndexerDefinition(
    daoContract,
    { ...IGovernorEntities, GovernorAggregates },
    {
      name: sharedIndexer.name,
      eventHandlers: {
        ...sharedIndexer.eventHandlers,
        ProposalThresholdBPSSet: {
          async handle(handle, [oldValue, newValue]) {
            const agg = await loadGovernanceAggregate(handle);
            agg.proposalThresholdBps = newValue;
            saveGovernanceAggregate(handle, agg);
          },
        },
        MinQuorumVotesBPSSet: {
          async handle(handle, [oldValue, newValue]) {
            const agg = await loadGovernanceAggregate(handle);
            agg.quorumFloorBps = newValue;
            saveGovernanceAggregate(handle, agg);
          },
        },
        MaxQuorumVotesBPSSet: {
          async handle(handle, [oldValue, newValue]) {
            const agg = await loadGovernanceAggregate(handle);
            agg.quorumCeilingBps = newValue;
            saveGovernanceAggregate(handle, agg);
          },
        },
      },
    }
  );
})();

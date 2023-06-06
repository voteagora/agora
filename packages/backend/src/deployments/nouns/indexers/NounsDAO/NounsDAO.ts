import { nounsDao, nounsDaoSepolia } from "@agora/common";

import { Env } from "../../../../shared/types";
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
export const daoContractSepolia = intoContractInstance(nounsDaoSepolia);

const makeGovernorIndex = (env: Env) => {
  const sharedIndexer = makeGovernorIndexer(
    env === "prod" ? daoContract : daoContractSepolia,
    "NounsDAO"
  );

  return makeIndexerDefinition(
    env === "prod" ? daoContract : daoContractSepolia,
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
};

export const governorIndexer = makeGovernorIndex("prod");
export const governorIndexerSepolia = makeGovernorIndex("dev");

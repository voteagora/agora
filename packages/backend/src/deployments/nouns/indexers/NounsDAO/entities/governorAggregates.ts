import { BigNumber } from "ethers";

import { makeEntityDefinition, serde } from "../../../../../shared/indexer";
import { StorageHandle } from "../../../../../shared/indexer/process/storageHandle";
import { EntityRuntimeType } from "../../../../../shared/indexer/process/process";
import { ReaderEntities } from "../../../../../shared/indexer/storage/reader/type";

export const GovernorAggregates = makeEntityDefinition({
  serde: serde.object({
    quorumFloorBps: serde.number,
    quorumCeilingBps: serde.number,
    proposalThresholdBps: serde.bigint,
  }),
  indexes: {},
});

type EntityTypes = {
  GovernorAggregates: typeof GovernorAggregates;
};

const governanceAggregatesKey = "AGGREGATE";

function makeDefaultGovernanceAggregate(): EntityRuntimeType<
  typeof GovernorAggregates
> {
  return {
    quorumFloorBps: 1,
    quorumCeilingBps: 1,
    proposalThresholdBps: 0n,
  };
}

export async function loadGovernanceAggregate(
  handle: ReaderEntities<EntityTypes>
): Promise<EntityRuntimeType<typeof GovernorAggregates>> {
  const aggregates = await handle.getEntity(
    "GovernorAggregates",
    governanceAggregatesKey
  );

  return aggregates ?? makeDefaultGovernanceAggregate();
}

export function saveGovernanceAggregate(
  handle: StorageHandle<EntityTypes>,
  entity: EntityRuntimeType<typeof GovernorAggregates>
) {
  handle.saveEntity("GovernorAggregates", governanceAggregatesKey, entity);
}

export function totalVotes({
  forVotes,
  againstVotes,
  abstainVotes,
}: {
  forVotes: BigNumber;
  againstVotes: BigNumber;
  abstainVotes: BigNumber;
}): BigNumber {
  return forVotes.add(againstVotes).add(abstainVotes);
}

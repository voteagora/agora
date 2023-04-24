import { makeEntityDefinition, serde } from "../../../../indexer";
import { EntityRuntimeType } from "../../../../indexer/process/process";
import { StorageHandle } from "../../../../indexer/process/storageHandle";
import { ReaderEntities } from "../../../../indexer/storage/reader/type";

export const IGovernorAggregate = makeEntityDefinition({
  serde: serde.object({
    totalProposals: serde.number,
  }),
  indexes: {},
});

type EntityTypes = {
  IGovernorAggregate: typeof IGovernorAggregate;
};

const governanceAggregatesKey = "AGGREGATE";

export async function loadGovernanceAggregate(
  handle: ReaderEntities<EntityTypes>
): Promise<EntityRuntimeType<typeof IGovernorAggregate>> {
  const aggregates = await handle.getEntity(
    "IGovernorAggregate",
    governanceAggregatesKey
  );

  return aggregates ?? makeDefaultGovernanceAggregate();
}

function makeDefaultGovernanceAggregate(): EntityRuntimeType<
  typeof IGovernorAggregate
> {
  return {
    totalProposals: 0,
  };
}

export function saveGovernanceAggregate(
  handle: StorageHandle<EntityTypes>,
  entity: EntityRuntimeType<typeof IGovernorAggregate>
) {
  handle.saveEntity("IGovernorAggregate", governanceAggregatesKey, entity);
}

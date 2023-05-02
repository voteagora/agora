import { makeEntityDefinition, serde } from "../../../../indexer";
import { WritableStorageHandle } from "../../../../indexer/process/storageHandle";
import { EntityRuntimeType } from "../../../../indexer/process/process";
import { ReaderEntities } from "../../../../indexer/storage/reader/type";

type EntitiesType = {
  IVotesAggregate: typeof IVotesAggregate;
};

export const IVotesAggregate = makeEntityDefinition({
  serde: serde.object({
    totalSupply: serde.bigint,
    delegatedSupply: serde.bigint,
    totalOwners: serde.number,
    totalDelegates: serde.number,
  }),
  indexes: {},
});

export async function loadAggregate(handle: ReaderEntities<EntitiesType>) {
  const cumulativeAggregate = await handle.getEntity(
    "IVotesAggregate",
    aggregateCumulativeId
  );

  return cumulativeAggregate ?? makeDefaultAggregate();
}

export function saveAggregate(
  handle: WritableStorageHandle<EntitiesType>,
  entity: EntityRuntimeType<typeof IVotesAggregate>
) {
  return handle.saveEntity("IVotesAggregate", aggregateCumulativeId, entity);
}

const aggregateCumulativeId = "CUMULATIVE";

function makeDefaultAggregate(): EntityRuntimeType<typeof IVotesAggregate> {
  return {
    delegatedSupply: 0n,
    totalSupply: 0n,
    totalOwners: 0,
    totalDelegates: 0,
  };
}

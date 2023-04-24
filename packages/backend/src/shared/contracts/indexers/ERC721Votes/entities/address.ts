import { makeEntityDefinition, serde } from "../../../../indexer";
import { StorageHandle } from "../../../../indexer/process/storageHandle";
import { EntityRuntimeType } from "../../../../indexer/process/process";
import * as erc20Address from "../../ERC20Votes/entities/address";
import { ReaderEntities } from "../../../../indexer/storage/reader/type";

export const IVotesAddress = makeEntityDefinition({
  serde: erc20Address.IVotesAddress.serde.extend({
    tokensOwnedIds: serde.array(serde.bigint),
    tokensRepresentedIds: serde.array(serde.bigint),
  }),
  indexes: {
    ...erc20Address.IVotesAddress.indexes,
  },
});

type EntitiesType = {
  IVotesAddress: typeof IVotesAddress;
};

export async function loadAccount(
  handle: ReaderEntities<EntitiesType>,
  from: string
): Promise<EntityRuntimeType<typeof IVotesAddress>> {
  return (
    (await handle.getEntity("IVotesAddress", from)) ?? defaultAccount(from)
  );
}

export function saveAccount(
  handle: StorageHandle<EntitiesType>,
  entity: EntityRuntimeType<typeof IVotesAddress>
) {
  return handle.saveEntity("IVotesAddress", entity.address, entity);
}

function defaultAccount(from: string): EntityRuntimeType<typeof IVotesAddress> {
  return {
    ...erc20Address.defaultAccount(from, from),
    tokensRepresentedIds: [],
    tokensOwnedIds: [],
  };
}

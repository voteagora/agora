import { ethers } from "ethers";

import { makeEntityDefinition, serde } from "../../../../indexer";
import { efficientLengthEncodingNaturalNumbers } from "../../../../utils/efficientLengthEncoding";
import { EntityRuntimeType } from "../../../../indexer/process/process";
import { StorageHandle } from "../../../../indexer/process/storageHandle";
import { ReaderEntities } from "../../../../indexer/storage/reader/type";

export const IVotesAddress = makeEntityDefinition({
  serde: serde.object({
    address: serde.string,
    tokensOwned: serde.bigint,
    tokensRepresented: serde.bigint,
    delegatingTo: serde.string,
    accountsRepresentedCount: serde.bigint,
  }),
  indexes: {
    byTokensOwned: {
      indexKey(entity) {
        return efficientLengthEncodingNaturalNumbers(
          ethers.BigNumber.from(entity.tokensOwned).mul(-1)
        );
      },
    },
    byTokensRepresented: {
      indexKey(entity) {
        return efficientLengthEncodingNaturalNumbers(
          ethers.BigNumber.from(entity.tokensRepresented).mul(-1)
        );
      },
    },
    byTokenHoldersRepresented: {
      indexKey(entity) {
        return efficientLengthEncodingNaturalNumbers(
          ethers.BigNumber.from(entity.accountsRepresentedCount).mul(-1)
        );
      },
    },
    byDelegatingTo: {
      indexKey(entity) {
        return entity.delegatingTo;
      },
    },
  },
});

type EntityTypes = {
  IVotesAddress: typeof IVotesAddress;
};

export async function loadAccount(
  handle: ReaderEntities<EntityTypes>,
  from: string
): Promise<EntityRuntimeType<typeof IVotesAddress>> {
  return (
    (await handle.getEntity("IVotesAddress", from)) ?? defaultAccount(from)
  );
}

export function saveAccount(
  handle: StorageHandle<EntityTypes>,
  entity: EntityRuntimeType<typeof IVotesAddress>
) {
  handle.saveEntity("IVotesAddress", entity.address, entity);
}

export function defaultAccount(
  from: string,
  initialDelegatingTo: string = ethers.constants.AddressZero
): EntityRuntimeType<typeof IVotesAddress> {
  return {
    address: from,
    tokensOwned: 0n,
    delegatingTo: initialDelegatingTo,
    tokensRepresented: 0n,
    accountsRepresentedCount: 0n,
  };
}

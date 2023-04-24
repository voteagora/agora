import { ethers } from "ethers";

import { makeEntityDefinition, serde } from "../../../../indexer";
import { encodeOrdinal, logToOrdinal, ordinal } from "../../ordinal";
import { makeCompoundKey } from "../../../../indexer/storage/keys/indexKey";
import { efficientLengthEncodingNaturalNumbers } from "../../../../utils/efficientLengthEncoding";
import { StorageHandle } from "../../../../indexer/process/storageHandle";
import { takeFirst } from "../../../../utils/generatorUtils";
import { Reader } from "../../../../indexer/storage/reader/type";

import { IVotesAddress } from "./address";

type EntitiesType = {
  IVotesAddressSnapshot: typeof IVotesAddressSnapshot;
};

export const IVotesAddressSnapshot = makeEntityDefinition({
  serde: serde.object({
    address: serde.string,
    ordinal,
    tokensRepresentedIds: serde.array(serde.bigint),
  }),
  indexes: {
    byBlockNumber: {
      indexKey({ address, ordinal }) {
        return makeCompoundKey(
          address,
          ...encodeOrdinal(ordinal).map((it) =>
            efficientLengthEncodingNaturalNumbers(it.mul(-1))
          )
        );
      },
    },
  },
});

export function saveAddressSnapshot(
  handle: StorageHandle<EntitiesType>,
  account: serde.RuntimeType<typeof IVotesAddress["serde"]>,
  log: ethers.providers.Log
) {
  const ordinal = logToOrdinal(log);

  handle.saveEntity(
    "IVotesAddressSnapshot",
    [account.address, ...encodeOrdinal(ordinal)].join("-"),
    {
      address: account.address,
      ordinal,
      tokensRepresentedIds: account.tokensRepresentedIds,
    }
  );
}

export async function getSnapshotForAddress(
  { address, startBlock }: { address: string; startBlock: bigint },
  reader: Reader<EntitiesType>
) {
  const snapshot = await takeFirst(
    reader.getEntitiesByIndex("IVotesAddressSnapshot", "byBlockNumber", {
      prefix: {
        indexKey: makeCompoundKey(address, ""),
      },
      starting: {
        indexKey: makeCompoundKey(
          address,
          efficientLengthEncodingNaturalNumbers(
            ethers.BigNumber.from(startBlock).mul(-1)
          )
        ),
      },
    })
  );

  if (!snapshot) {
    return {
      tokensRepresentedIds: [],
    };
  }

  return {
    tokensRepresentedIds: snapshot.value.tokensRepresentedIds,
  };
}

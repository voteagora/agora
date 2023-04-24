import { ethers } from "ethers";

import { makeEntityDefinition, serde } from "../../../../indexer";
import { encodeOrdinal, ordinal } from "../../ordinal";
import { efficientLengthEncodingNaturalNumbers } from "../../../../utils/efficientLengthEncoding";
import { WritableStorageHandle } from "../../../../indexer/process/storageHandle";

export const IVotesTotalSupplySnapshot = makeEntityDefinition({
  serde: serde.object({
    ordinal,
    totalSupply: serde.bigint,
  }),
  indexes: {
    byOrdinal: {
      indexKey({ ordinal }) {
        return encodeOrdinal(ordinal)
          .map((it) =>
            efficientLengthEncodingNaturalNumbers(
              ethers.BigNumber.from(it).mul(-1)
            )
          )
          .join("-");
      },
    },
  },
});

type EntitiesType = {
  IVotesTotalSupplySnapshot: typeof IVotesTotalSupplySnapshot;
};

export function snapshotTotalSupply(
  handler: WritableStorageHandle<EntitiesType>,
  ordinalValue: serde.RuntimeType<typeof ordinal>,
  totalSupply: serde.RuntimeType<typeof serde.bigint>
) {
  handler.saveEntity(
    "IVotesTotalSupplySnapshot",
    encodeOrdinal(ordinalValue).join("-"),
    {
      totalSupply,
      ordinal: ordinalValue,
    }
  );
}

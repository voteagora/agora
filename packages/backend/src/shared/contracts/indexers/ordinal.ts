import { BigNumber, ethers } from "ethers";

import { serde } from "../../indexer";

export const ordinal = serde.object({
  blockNumber: serde.number,
  transactionIndex: serde.number,
  logIndex: serde.number,
});

export function encodeOrdinal(ordinalValue: serde.RuntimeType<typeof ordinal>) {
  return [
    BigNumber.from(ordinalValue.blockNumber),
    BigNumber.from(ordinalValue.transactionIndex),
    BigNumber.from(ordinalValue.logIndex),
  ];
}

export function logToOrdinal(
  log: ethers.providers.Log
): serde.RuntimeType<typeof ordinal> {
  return {
    blockNumber: log.blockNumber,
    transactionIndex: log.transactionIndex,
    logIndex: log.logIndex,
  };
}

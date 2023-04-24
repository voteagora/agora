import { Address } from "viem";
import { ethers } from "ethers";

import { StorageHandle } from "../../../indexer/process/storageHandle";
import { logToOrdinal } from "../ordinal";

import {
  IVotesAggregate,
  loadAggregate,
  saveAggregate,
} from "./entities/aggregate";
import {
  IVotesTotalSupplySnapshot,
  snapshotTotalSupply,
} from "./entities/totalSupplySnapshot";

export async function updateTotalSupply(
  from: Address,
  to: Address,
  amount: bigint,
  log: ethers.providers.Log,
  handle: StorageHandle<{
    IVotesAggregate: typeof IVotesAggregate;
    IVotesTotalSupplySnapshot: typeof IVotesTotalSupplySnapshot;
  }>
) {
  const totalSupplyChange = (() => {
    if (to === ethers.constants.AddressZero) {
      return -amount;
    }

    if (from === ethers.constants.AddressZero) {
      return amount;
    }

    return 0n;
  })();

  if (totalSupplyChange === 0n) {
    return;
  }

  const aggregate = await loadAggregate(handle);
  aggregate.totalSupply += totalSupplyChange;

  saveAggregate(handle, aggregate);

  const ordinal = logToOrdinal(log);
  snapshotTotalSupply(handle, ordinal, aggregate.totalSupply);
}

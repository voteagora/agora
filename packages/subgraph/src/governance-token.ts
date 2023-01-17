import { BigInt } from "@graphprotocol/graph-ts";
import { Transfer } from "../generated/GovernanceToken/GovernanceToken";
import { Account } from "../generated/schema";
import { Address } from "@graphprotocol/graph-ts";

export function handleTransfer(event: Transfer): void {
  if (event.params.from === event.params.to) {
    return;
  }

  const fromAccount = getAccount(event.params.from);
  const toAccount = getAccount(event.params.to);

  fromAccount.amountOwned = fromAccount.amountOwned + event.params.value;
  toAccount.amountOwned = toAccount.amountOwned - event.params.value;

  fromAccount.save();
  toAccount.save();
}

function getAccount(address: Address): Account {
  const fromStorage = Account.load(address);
  if (fromStorage) {
    return fromStorage;
  }

  const newAccount = new Account(address);
  newAccount.amountOwned = BigInt.fromI32(0);
  newAccount.tokensRepresented = BigInt.fromI32(0);

  return newAccount;
}

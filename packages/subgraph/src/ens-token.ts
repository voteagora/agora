import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  DelegateChanged,
  DelegateVotesChanged,
  Transfer,
} from "../generated/ENSToken/ENSToken";
import { Account } from "../generated/schema";
import { getMetrics } from "./metrics";

export function handleDelegateVotesChanged(event: DelegateVotesChanged): void {
  const account = getOrCreateAccount(event.params.delegate);

  if (!event.params.previousBalance.equals(account.tokensRepresented)) {
    throw new Error("unexpected previous balance");
  }

  account.tokensRepresented = event.params.newBalance;

  const metrics = getMetrics();
  metrics.delegatedSupply =
    metrics.delegatedSupply +
    (event.params.newBalance - event.params.previousBalance);

  metrics.save();
  account.save();
}

export function handleDelegateChanged(event: DelegateChanged): void {
  if (event.params.fromDelegate == event.params.toDelegate) {
    return;
  }

  const delegatorAddress = event.params.delegator.toHex();

  const delegatorAccount = getOrCreateAccount(event.params.delegator);
  if (
    (delegatorAccount.delegatingTo
      ? delegatorAccount.delegatingTo
      : Address.zero().toHex()) != event.params.fromDelegate.toHex()
  ) {
    throw new Error(
      `mismatched from address got: ${!!delegatorAccount.delegatingTo} ${event.params.fromDelegate.toHex()}`
    );
  }

  delegatorAccount.delegatingTo = event.params.toDelegate.toHex();

  const fromAccount = getOrCreateAccount(event.params.fromDelegate);
  const toAccount = getOrCreateAccount(event.params.toDelegate);

  fromAccount.save();
  toAccount.save();
  delegatorAccount.save();
}

export function handleTransfer(event: Transfer): void {
  if (event.params.from == event.params.to) {
    return;
  }

  const metrics = getMetrics();
  if (event.params.from == Address.zero()) {
    metrics.totalSupply = metrics.totalSupply + event.params.value;
  }

  if (event.params.to == Address.zero()) {
    metrics.totalSupply = metrics.totalSupply - event.params.value;
  }

  const fromAccount = getOrCreateAccount(event.params.from);
  const toAccount = getOrCreateAccount(event.params.to);

  const amount = event.params.value;

  fromAccount.amountOwned = fromAccount.amountOwned - amount;
  toAccount.amountOwned = toAccount.amountOwned + amount;

  fromAccount.save();
  toAccount.save();
  metrics.save();
}

function getOrCreateAccount(address: Address): Account {
  const loadedAccount = Account.load(address.toHex());
  if (loadedAccount) {
    return loadedAccount;
  }

  const account = new Account(address.toHex());
  account.tokensRepresented = BigInt.zero();
  account.amountOwned = BigInt.zero();
  return account;
}

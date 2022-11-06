import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  DelegateChanged,
  DelegateVotesChanged,
  Transfer,
} from "../generated/ENSToken/ENSToken";
import { Account, Block, Metrics, Proposal, Vote } from "../generated/schema";
import {
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
  QuorumNumeratorUpdated,
  VoteCast,
} from "../generated/ENSGovernor/ENSGovernor";

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

export function handleProposalCreated(event: ProposalCreated): void {
  const proposal = new Proposal(event.params.proposalId.toString());

  proposal.proposer = event.params.proposer.toHex();
  proposal.startBlock = event.params.startBlock;
  proposal.endBlock = event.params.endBlock;
  proposal.description = event.params.description;
  proposal.targets = event.params.targets.map<string>((it) => it.toHex());
  proposal.values = event.params.values;
  proposal.signatures = event.params.signatures;
  proposal.calldatas = event.params.calldatas;

  proposal.status = "CREATED";

  proposal.save();
}

export function handleVoteCast(event: VoteCast): void {
  const transactionHash = event.transaction.hash.toHex();
  const blockHash = event.block.hash.toHex();

  const block = new Block(blockHash);
  block.timestamp = block.timestamp;
  block.save();

  const vote = new Vote(transactionHash);
  vote.block = blockHash;
  vote.proposal = event.params.proposalId.toString();
  vote.voter = event.params.voter.toHex();
  vote.support = event.params.support;
  vote.weight = event.params.weight;
  vote.reason = event.params.reason;
  vote.save();
}

export function handleProposalCanceled(event: ProposalCanceled): void {
  const proposal = mustGetProposal(event.params.proposalId);
  proposal.status = "CANCELLED";
  proposal.save();
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  const proposal = mustGetProposal(event.params.proposalId);
  proposal.status = "EXECUTED";
  proposal.save();
}

export function handleProposalQueued(event: ProposalQueued): void {
  const proposal = mustGetProposal(event.params.proposalId);
  proposal.status = "QUEUED";
  proposal.activatedAt = event.params.eta;
  proposal.save();
}

export function handleQuorumNumeratorUpdated(
  event: QuorumNumeratorUpdated
): void {
  const metrics = getMetrics();
  metrics.quorumNumerator = event.params.newQuorumNumerator;
  metrics.save();
}

function mustGetProposal(proposalId: BigInt): Proposal {
  const proposal = Proposal.load(proposalId.toString());
  if (!proposal) {
    throw new Error("could not find proposal");
  }

  return proposal;
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

function getMetrics(): Metrics {
  const loaded = Metrics.load("METRICS");
  if (loaded) {
    return loaded;
  }

  const newMetrics = new Metrics("METRICS");
  newMetrics.totalSupply = BigInt.zero();
  newMetrics.quorumNumerator = BigInt.zero();
  newMetrics.delegatedSupply = BigInt.zero();
  return newMetrics;
}

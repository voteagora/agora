import {
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
  QuorumNumeratorUpdated,
  VoteCast,
} from "../generated/ENSGovernor/ENSGovernor";
import { Block, Proposal, Vote } from "../generated/schema";
import { getMetrics } from "./metrics";
import { BigInt } from "@graphprotocol/graph-ts";

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
  const blockHash = event.block.hash.toHex();

  const block = new Block(blockHash);
  block.timestamp = event.block.timestamp;
  block.save();

  const voteId = event.transaction.hash.toHex() + "-" + event.logIndex.toHex();
  const vote = new Vote(voteId);
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

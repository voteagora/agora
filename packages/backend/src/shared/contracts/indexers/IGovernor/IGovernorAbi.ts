import { parseAbi } from "abitype";

import { stripEventInputNamesFromAbi } from "../../../indexer/process/stripEventArgNames";

export const IGovernorAbi = stripEventInputNamesFromAbi(
  parseAbi([
    `event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)`,
    `event ProposalCanceled(uint256 proposalId)`,
    `event ProposalExecuted(uint256 proposalId)`,
    `event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)`,
  ])
);

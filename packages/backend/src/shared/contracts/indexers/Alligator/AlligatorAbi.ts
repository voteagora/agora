import {
  AbiParametersToPrimitiveTypes,
  parseAbi,
  parseAbiParameters,
} from "abitype";

import { stripEventInputNamesFromAbi } from "../../../indexer/process/stripEventArgNames";

const rulesType =
  `uint8 permissions, uint8 maxRedelegations, uint32 notValidBefore, uint32 notValidAfter, uint16 blocksBeforeVoteCloses, address customRule` as const;

export const rulesAbiParameters = parseAbiParameters(rulesType);

export type AbiRulesType = AbiParametersToPrimitiveTypes<
  typeof rulesAbiParameters
>;

export const AlligatorAbi = stripEventInputNamesFromAbi(
  parseAbi([
    `event ProxyDeployed(address indexed owner, address proxy)`,
    `event SubDelegation(address indexed from, address indexed to, (${rulesType}) rules)`,
    `event SubDelegations(address indexed from, address[] to, (${rulesType})[] rules)`,
    `event VoteCast(address indexed proxy, address indexed voter, address[] authority, uint256 proposalId, uint8 support)`,
    `event VotesCast(address[] proxies, address indexed voter, address[][] authorities, uint256 proposalId, uint8 support)`,
    `event Signed(address indexed proxy, address[] authority, bytes32 messageHash)`,
  ])
);

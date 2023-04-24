import { parseAbi } from "abitype";

import { stripEventInputNamesFromAbi } from "../../../indexer/process/stripEventArgNames";

export const ERC721VotesAbi = stripEventInputNamesFromAbi(
  parseAbi([
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event DelegateVotesChanged(address indexed delegate, uint previousBalance, uint newBalance)",
    "event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)",
  ])
);

import { IVotesAggregate } from "../../IVotes/entities/aggregate";
import { IVotesTotalSupplySnapshot } from "../../IVotes/entities/totalSupplySnapshot";

import { IVotesAddressSnapshot } from "./addressSnapshot";
import { IVotesAddress } from "./address";

export const erc721EntityDefinitions = {
  IVotesAggregate,
  IVotesTotalSupplySnapshot,
  IVotesAddress,
  IVotesAddressSnapshot,
};

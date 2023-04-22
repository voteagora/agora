import { makeContractInstance } from "../hooks/useContractWrite";

import {
  NounsDAOLogicV2__factory,
  NounsToken__factory,
  ZoraAuctionHouse__factory,
  Alligator__factory,
} from "./generated";

export const nounsDao = makeContractInstance({
  factory: NounsDAOLogicV2__factory,
  address: "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d",
  startingBlock: 12985453,
});

export const nounsToken = makeContractInstance({
  factory: NounsToken__factory,
  address: "0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03",
  startingBlock: 12985438,
});

export const zoraAuctionHouse = makeContractInstance({
  factory: ZoraAuctionHouse__factory,
  address: "0xE468cE99444174Bd3bBBEd09209577d25D1ad673",
  startingBlock: 12372205,
});

export const nounsAlligator = makeContractInstance({
  factory: Alligator__factory,
  address: "0x57aa7DeD5187C423AD8B3bd5c91f2211cD97b2A3",
  startingBlock: 16750535,
});

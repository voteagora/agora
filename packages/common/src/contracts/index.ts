import { makeContractInstance } from "./types";
import { NounsDAOLogicV2 } from "./abiTypeAbis/NounsDAOLogicV2";
import { NounsToken } from "./abiTypeAbis/NounsToken";
import { Alligator } from "./abiTypeAbis/Alligator";

export const nounsDao = makeContractInstance({
  abi: NounsDAOLogicV2,
  address: "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d",
  startingBlock: 12985453,
});

export const nounsToken = makeContractInstance({
  abi: NounsToken,
  address: "0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03",
  startingBlock: 12985438,
});

export const nounsAlligator = makeContractInstance({
  abi: Alligator,
  address: "0x57aa7DeD5187C423AD8B3bd5c91f2211cD97b2A3",
  startingBlock: 16750535,
});

export * from "./types";
export * from "./supportType";

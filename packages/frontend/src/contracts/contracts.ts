import { NounsDAOLogicV2__factory, NounsToken__factory } from "./generated";
import { makeContractInstance } from "../hooks/useContractWrite";

export const nounsDao = makeContractInstance({
  iface: NounsDAOLogicV2__factory.createInterface(),
  address: "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d",
  startingBlock: 12985453,
});

export const nounsToken = makeContractInstance({
  iface: NounsToken__factory.createInterface(),
  address: "0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03",
  startingBlock: 12985438,
});

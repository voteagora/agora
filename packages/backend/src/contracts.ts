import { ethers } from "ethers";
import {
  NounsDAOLogicV1__factory,
  NounsToken__factory,
} from "./contracts/generated";

export type ContractInstance<InterfaceType extends TypedInterface> = {
  iface: InterfaceType;
  address: string;
  startingBlock: number;
};
export interface TypedInterface extends ethers.utils.Interface {
  events: Record<string, ethers.utils.EventFragment<Record<string, any>>>;
}

function makeContractInstance<InterfaceType extends TypedInterface>(
  t: ContractInstance<InterfaceType>
): ContractInstance<InterfaceType> {
  return t;
}

export const nounsToken = makeContractInstance({
  iface: NounsToken__factory.createInterface(),
  address: "0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03",
  startingBlock: 12985438,
});

export const nounsDao = makeContractInstance({
  iface: NounsDAOLogicV1__factory.createInterface(),
  address: "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d",
  startingBlock: 12985453,
});

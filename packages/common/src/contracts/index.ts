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
  address: "0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03",
  startingBlock: 12985438,
});

export const nounsAlligator = makeContractInstance({
  abi: Alligator,
  address: "0xb6D1EB1A7BE7d55224bB1942C74a5251E6c9Dab3",
  startingBlock: 16996023,
});

export const nounsDaoSepolia = makeContractInstance({
  abi: NounsDAOLogicV2,
  address: "0x461208f0073e3b1C9Cec568DF2fcACD0700C9B7a",
  startingBlock: 3589193,
});

export const nounsTokenSepolia = makeContractInstance({
  abi: NounsToken,
  address: "0x05d570185F6e2d29AdaBa1F36435f50Bc44A6f17",
  startingBlock: 3589193,
});

export const nounsAlligatorSepolia = makeContractInstance({
  abi: Alligator,
  address: "0x40Cc6dA4FE4000997cF1ca72e30181eAD6154F83",
  startingBlock: 3589193,
});

export const GOVPOOL_CONTRACT_ADDRESS =
  "0x6b2645b468A828a12fEA8C7D644445eB808Ec2B1";

export * from "./types";
export * from "./supportType";

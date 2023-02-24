import { De, SerDe } from "./types";
import { ethers } from "ethers";

export const bigNumber: SerDe<ethers.BigNumber, string> = {
  serialize(item) {
    return item.toString();
  },

  deserialize(serialized) {
    return ethers.BigNumber.from(serialized);
  },
};

export const bigNumberParseNumber: De<number, string> = {
  deserialize(serialized: string): number {
    return ethers.BigNumber.from(serialized).toNumber();
  },
};

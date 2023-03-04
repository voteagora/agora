declare module "ethers" {
  import { ethers } from "ethers";
  declare class BigNumber {
    static from(str: string): ethers.BigNumber;
  }
}

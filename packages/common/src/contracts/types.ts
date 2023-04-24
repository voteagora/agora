import { ethers } from "ethers";
import { Abi } from "abitype";

export interface Contract<InterfaceType extends TypedInterface>
  extends ethers.BaseContract {
  interface: InterfaceType;
}

export interface TypedInterface extends ethers.utils.Interface {
  events: Record<string, ethers.utils.EventFragment>;
  functions: Record<string, ethers.utils.FunctionFragment>;
}

export type ContractInstance<TAbi extends Abi> = {
  abi: TAbi;
  address: string;
  startingBlock: number;
};

export type ContractInterfaceType<
  ContractType extends Contract<TypedInterface>
> = ContractType extends Contract<infer InterfaceType> ? InterfaceType : never;

export function makeContractInstance<TAbi extends Abi>(
  t: ContractInstance<TAbi>
): ContractInstance<TAbi> {
  return t;
}

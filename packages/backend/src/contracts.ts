import { ethers } from "ethers";
import { TopicFilter } from "./indexer/logProvider/logProvider";
import { LogDescription } from "@ethersproject/abi/src.ts/interface";
import { EventFragmentArg } from "./indexer/process";

export type ContractInstance<InterfaceType extends TypedInterface> = {
  iface: InterfaceType;
  address: string;
  startingBlock: number;
};

export interface TypedInterface extends ethers.utils.Interface {
  events: Record<string, ethers.utils.EventFragment<Record<any, any>>>;
}

export function parseLogTyped<InterfaceType extends TypedInterface>(
  typedInterface: InterfaceType,
  log: {
    topics: Array<string>;
    data: string;
  }
): {
  [Signature in keyof InterfaceType["events"] & string]: LogDescription<
    Signature,
    EventFragmentArg<InterfaceType["events"][Signature]>
  >;
}[keyof InterfaceType["events"] & string] {
  return typedInterface.parseLog(log) as any;
}

export function makeContractInstance<InterfaceType extends TypedInterface>(
  t: ContractInstance<InterfaceType>
): ContractInstance<InterfaceType> {
  return t;
}

export type Signatures<InterfaceType extends TypedInterface> = {
  [K in keyof InterfaceType["events"] & string]: K;
}[keyof InterfaceType["events"] & string][];

export function filterForEventHandlers<InterfaceType extends TypedInterface>(
  instance: ContractInstance<InterfaceType>,
  signatures: Signatures<InterfaceType>
): TopicFilter {
  return {
    address: [instance.address],
    topics: [topicsForSignatures(instance.iface, signatures)],
  };
}

export function topicsForSignatures<InterfaceType extends TypedInterface>(
  iface: InterfaceType,
  signatures: Signatures<InterfaceType>
) {
  return signatures.map((signature) => {
    const fragment = ethers.utils.EventFragment.fromString(signature);
    return ethers.utils.Interface.getEventTopic(fragment);
  });
}

import {
  ContractInstance as CommonContractInstance,
  TypedInterface,
} from "@agora/common";
import { Abi, AbiEvent, ExtractAbiEvents } from "abitype";

import { UnionToIntersection } from "../../utils/unionToIntersection";

export type ContractInstance<TAbiEvents extends AbiEvents> = {
  abiEvents: TAbiEvents;
  address: string;
  startingBlock: number;
};

export type AbiEventsMapping<TAbi extends Abi> = UnionToIntersection<
  DistributeMappedEventEntry<ExtractAbiEvents<TAbi>>
>;

type DistributeMappedEventEntry<TAbiEvent extends AbiEvent> =
  TAbiEvent extends AbiEvent ? Record<TAbiEvent["name"], TAbiEvent> : never;

export type AbiEvents = Record<string, AbiEvent>;

function eventsFromAbi<TAbi extends Abi>(abi: TAbi): AbiEventsMapping<TAbi> {
  return abi
    .flatMap((it) => {
      if (it.type !== "event") {
        return [];
      }

      return [it];
    })
    .reduce((acc, it) => {
      return {
        // @ts-expect-error
        ...acc,
        [it.name]: it,
      };
    }, {} as AbiEventsMapping<TAbi>);
}

export function intoContractInstance<
  InterfaceType extends TypedInterface,
  TAbi extends Abi
>(
  contract: CommonContractInstance<TAbi>
  // @ts-expect-error
): ContractInstance<AbiEventsMapping<TAbi>> {
  return {
    abiEvents: eventsFromAbi(contract.abi),
    address: contract.address,
    startingBlock: contract.startingBlock,
  };
}

import * as Sentry from "@sentry/react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import {
  usePrepareContractWrite as usePrepareContractWriteUNSAFE,
  useContractWrite as useContractWriteUNSAFE,
} from "wagmi";
import { CallOverrides } from 'ethers';

export interface Contract<InterfaceType extends TypedInterface>
  extends ethers.BaseContract {
  interface: InterfaceType;
}

export interface TypedInterface extends ethers.utils.Interface {
  events: Record<string, ethers.utils.EventFragment<Record<string, any>>>;
}

export type ContractInstance<InterfaceType extends TypedInterface> = {
  iface: InterfaceType;
  address: string;
  startingBlock: number;
};

type ContractInterfaceType<ContractType extends Contract<TypedInterface>> =
  ContractType extends Contract<infer InterfaceType> ? InterfaceType : never;

export function makeContractInstance<InterfaceType extends TypedInterface>(
  t: ContractInstance<InterfaceType>
): ContractInstance<InterfaceType> {
  return t;
}

export function useContractWrite<
  ContractType extends Contract<TypedInterface>,
  Function extends keyof ContractType["functions"] & string
>(
  instance: ContractInstance<ContractInterfaceType<ContractType>>,
  name: Function,
  args: Parameters<ContractType["functions"][Function]>,
  onSuccess: () => void,
  overrides?: CallOverrides,
) {
  const { config } = usePrepareContractWriteUNSAFE({
    addressOrName: instance.address,
    contractInterface: instance.iface,
    functionName: name,
    args,
    onError(e) {
      const id = Sentry.captureException(e);
      console.error(e);
      // toast(`an error occurred when preparing transaction ${id}`);
    },
    overrides
  });

  const { write } = useContractWriteUNSAFE({
    ...config,
    onSuccess() {
      onSuccess();
    },
    onError(e) {
      const id = Sentry.captureException(e);
      console.error(e);
      // toast(`an error occurred when preparing transaction ${id}`);
    },
    overrides,
  });

  return write;
}

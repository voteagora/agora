import * as Sentry from "@sentry/react";
import { ethers } from "ethers";
import {
  usePrepareContractWrite as usePrepareContractWriteUNSAFE,
  useContractWrite as useContractWriteUNSAFE,
} from "wagmi";
import { CallOverrides } from "ethers";

export interface Contract<InterfaceType extends TypedInterface>
  extends ethers.BaseContract {
  interface: InterfaceType;
}

export interface TypedInterface extends ethers.utils.Interface {
  events: Record<string, ethers.utils.EventFragment<Record<string, any>>>;
}

export interface TypedInterfaceFactory<InterfaceType extends TypedInterface> {
  abi: any;
  createInterface(): InterfaceType;
}

export type ContractInstance<InterfaceType extends TypedInterface> = {
  factory: TypedInterfaceFactory<InterfaceType>;
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
  overrides?: CallOverrides
) {
  const { config } = usePrepareContractWriteUNSAFE({
    address: instance.address as any,
    abi: instance.factory.abi,
    functionName: name,
    args,
    onError(e) {
      const id = Sentry.captureException(e);
      console.error(e, { id });
      // toast(`an error occurred when preparing transaction ${id}`);
    },
    overrides,
  });

  const { write } = useContractWriteUNSAFE({
    ...config,
    request: (() => {
      if (!config.request) {
        return;
      }

      return {
        ...config.request,
        gasLimit: config.request.gasLimit.mul(2),
      };
    })(),
    onSuccess() {
      onSuccess();
    },
    onError(e) {
      const id = Sentry.captureException(e);
      console.error(e, { id });
      // toast(`an error occurred when preparing transaction ${id}`);
    },
  });

  return write;
}

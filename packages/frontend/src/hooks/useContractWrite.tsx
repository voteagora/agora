import * as Sentry from "@sentry/react";
import {
  writeContract,
  prepareWriteContract,
  Abi,
  ExtractAbiFunctionNames,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  Address,
} from "@wagmi/core";
import {
  usePrepareContractWrite as usePrepareContractWriteUNSAFE,
  useContractWrite as useContractWriteUNSAFE,
} from "wagmi";
import { CallOverrides } from "ethers";
import { useCallback } from "react";

type ContractInstance<TAbi extends Abi> = {
  abi: TAbi;
  address: string;
  startingBlock: number;
};

export function useContractWrite<
  TAbi extends Abi,
  Function extends ExtractAbiFunctionNames<TAbi>
>(
  instance: ContractInstance<TAbi>,
  name: Function,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<TAbi, Function>["inputs"]
  >,
  onSuccess: () => void,
  overrides?: CallOverrides
) {
  const { config } = usePrepareContractWriteUNSAFE({
    address: instance.address as any,
    abi: instance.abi as any,
    functionName: name,
    args: args as any,
    onError(e) {
      const id = Sentry.captureException(e);

      // eslint-disable-next-line
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

      // eslint-disable-next-line
      console.error(e, { id });
      // toast(`an error occurred when preparing transaction ${id}`);
    },
  });

  return useCallback(() => {
    write?.();
  }, [write]);
}

export function useContractWriteFn<
  TAbi extends Abi,
  Function extends ExtractAbiFunctionNames<TAbi, "nonpayable" | "payable">
>(instance: ContractInstance<TAbi>, name: Function) {
  return useCallback(
    async (
      args: AbiParametersToPrimitiveTypes<
        ExtractAbiFunction<TAbi, Function>["inputs"]
      >
    ) => {
      try {
        const config = await prepareWriteContract({
          address: instance.address as Address,
          abi: instance.abi as Abi,
          functionName: name as any,
          args: args as any,
        });

        await writeContract(config as any);
      } catch (e) {
        const id = Sentry.captureException(e);
        console.error(e, { id });
      }
    },
    [instance, name]
  );
}

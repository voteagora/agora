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
  useWaitForTransaction as useWaitForTransactionUNSAFE,
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
  const { config, error } = usePrepareContractWriteUNSAFE({
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

  const { data, write } = useContractWriteUNSAFE({
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

  const { isLoading, isSuccess, isError } = useWaitForTransactionUNSAFE({
    hash: data?.hash,
  });

  const writeFn = useCallback(() => {
    write?.();
  }, [write]);

  return {
    write: writeFn,
    isLoading,
    isSuccess,
    isError,
    canExecute: !error,
  };
}

export function useContractWriteFn<
  TAbi extends Abi,
  Function extends ExtractAbiFunctionNames<TAbi, "nonpayable" | "payable">
>(instance: ContractInstance<TAbi>, functionName: Function) {
  return useCallback(
    async (
      args: AbiParametersToPrimitiveTypes<
        ExtractAbiFunction<TAbi, Function>["inputs"]
      >
    ) => {
      const address = instance.address as Address;

      try {
        const config = await prepareWriteContract({
          address,
          abi: instance.abi as Abi,
          functionName: functionName as any,
          args: args as any,
        });

        await writeContract(config as any);
      } catch (e) {
        throw new ContractWriteError(
          {
            address,
            args: args as any,
            functionName,
          },
          e
        );
      }
    },
    [instance, functionName]
  );
}

type ContractWriteErrorParams = {
  address: Address;
  functionName: string;
  args: any[];
};

export class ContractWriteError extends Error {
  constructor(
    public readonly params: ContractWriteErrorParams,
    cause: unknown
  ) {
    super("ContractWriteError", { cause });
  }
}

function catchError(e: unknown) {
  const id = Sentry.captureException(e);
  // eslint-disable-next-line no-console
  console.error(e, { id });
}

export function handlingError<T>(promise: Promise<T>) {
  return promise.catch((err) => catchError(err));
}

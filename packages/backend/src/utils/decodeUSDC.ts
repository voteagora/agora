import { ethers } from "ethers";
import type { FunctionFragment } from "@ethersproject/abi";

import { USDC__factory } from "../contracts/generated";

export function decodeUSDCTransaction(
  signature: string,
  calldata: ethers.utils.BytesLike
) {
  const iface = USDC__factory.createInterface();

  if (iface.functions.hasOwnProperty(signature)) {
    // @ts-ignore
    const functionFragment = iface.functions[signature] as FunctionFragment;

    const decoded = ethers.utils.defaultAbiCoder.decode(
      functionFragment.inputs,
      calldata
    );

    return Object.fromEntries(
      functionFragment.inputs.map((params, idx) => {
        return [params.name, decoded[idx]];
      })
    );
  }
}

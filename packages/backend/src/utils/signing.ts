import { ValueWithSignature } from "../generated/types";
import { ethers } from "ethers";

export type ValidatedMessage = {
  address: string;
  value: string;
  signature: string;
};

export function validateSigned({
  value,
  signature,
}: ValueWithSignature): ValidatedMessage {
  const address = ethers.utils.verifyMessage(value, signature);

  return {
    address,
    value,
    signature,
  };
}

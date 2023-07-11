import { ethers } from "ethers";
import { GnosisSafe, GnosisSafe__factory } from "../contracts/generated";

export type ValueWithSignature = {
  signature: string;
  signerAddress: string;
  value: string;
  signatureType: "EOA" | "CONTRACT";
};

export type ValidatedMessage = {
  address: string;
  value: string;
  signature: string;
  signatureType: "EOA" | "CONTRACT";
};

export function hashEnvelopeValue(value: string) {
  return JSON.stringify({
    for: "nouns-agora",
    hashedValue: ethers.utils.hashMessage(value),
  });
}

const MAGIC_VALUE_BYTES = "0x20c13b0b";

const isValidSignature = async (
  safe: GnosisSafe,
  messageHash: string,
  signature: string
) => {
  // https://github.com/safe-global/safe-contracts/blob/main/contracts/handler/CompatibilityFallbackHandler.sol#L28
  const isValidSignature = await safe.isValidSignature(messageHash, signature);
  return isValidSignature?.slice(0, 10).toLowerCase() === MAGIC_VALUE_BYTES;
};

async function checkSafeSignature(
  safe: GnosisSafe,
  value: string,
  signature: string
) {
  const hashed = ethers.utils.hashMessage(value);
  return await isValidSignature(safe, hashed, signature);
}

export async function validateSigned(
  provider: ethers.providers.Provider,
  { signerAddress, value, signature, signatureType }: ValueWithSignature
): Promise<ValidatedMessage> {
  const parsedSignature = ethers.utils.arrayify(signature);
  const hashedMessage = hashEnvelopeValue(value);

  if (signatureType === "CONTRACT") {
    const safe = GnosisSafe__factory.connect(signerAddress, provider);
    const isSigned = await checkSafeSignature(safe, hashedMessage, signature);
    if (!isSigned) {
      throw new Error("not signed");
    }

    return {
      address: signerAddress,
      value,
      signature,
      signatureType,
    };
  } else {
    const address = ethers.utils.verifyMessage(hashedMessage, parsedSignature);
    if (address.toLowerCase() !== signerAddress.toLowerCase()) {
      throw new Error("signature address does not match signer address");
    }

    return {
      address,
      value,
      signature,
      signatureType,
    };
  }
}

import { ethers } from "ethers";

export const knownSigHashes: Record<string, string> = {
  "0x5ef2c7f0": "setSubnodeRecord(bytes32,bytes32,address,address,uint64)",
  "0x10f13a8c": "setText(bytes32,string,string)",
  "0xb4720477": "sendMessageToChild(address,bytes)",
  "0xa9059cbb": "transfer(address,uint256)",
  "0x095ea7b3": "approve(address,uint256)",
  "0x7b1837de": "fund(address,uint256)",
  "0x23b872dd": "transferFrom(address,address,uint256)",
};

type TokenSpec = {
  currency: string;
  decimals: number;
};

export const knownTokens: Record<string, TokenSpec> = {
  "0x0000000000000000000000000000000000000000": {
    currency: "ETH",
    decimals: 18,
  },
  "0x4200000000000000000000000000000000000006": {
    currency: "WETH",
    decimals: 18,
  },
  "0x4200000000000000000000000000000000000042": {
    currency: "OP",
    decimals: 18,
  },
  "0x7F5c764cBc14f9669B88837ca1490cCa17c31607": {
    currency: "USDC",
    decimals: 6,
  },
};

export function decodeArgsFromCalldata(calldata: string) {
  const signatureFromKnownSigHashes = knownSigHashes[calldata.slice(0, 10)];
  if (signatureFromKnownSigHashes) {
    const signature = signatureFromKnownSigHashes;
    const functionFragment =
      ethers.utils.FunctionFragment.fromString(signature);
    const decoded = ethers.utils.defaultAbiCoder.decode(
      functionFragment.inputs,
      "0x" + calldata.slice(10)
    );
    return decoded.values();
  }
  return [];
}

import { Address } from "viem";
import { ethers } from "ethers";

export type NameResolver = {
  resolveAddress(nameOrAddress: string): Promise<Address | null>;
  resolveNameFromAddress(address: Address): Promise<string | null>;
};

/**
 * A name resolver which does not attempt to lookup names externally. When this
 * resolver is used the address fallback is displayed instead of names
 * everywhere.
 *
 * This is useful when:
 * * debugging perf issues around ens name resolutions
 * * using the hardhat simulated chain from a forked chain as name resolutions
 *   are very slow there
 */
export function makeNopNameResolver(): NameResolver {
  return {
    async resolveAddress(nameOrAddress: string): Promise<Address | null> {
      if (ethers.utils.isHexString(nameOrAddress)) {
        return ethers.utils.getAddress(nameOrAddress) as Address;
      }

      return null;
    },
    async resolveNameFromAddress(address: Address): Promise<string | null> {
      return null;
    },
  };
}

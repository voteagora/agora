import { AddressResolvers, ResolvedNameResolvers } from "./generated/types";
import { ethers } from "ethers";
import { resolveNameFromAddress } from "../../utils/resolveName";

export type AddressModel = {
  address: string;
};

export const Address: AddressResolvers = {
  address({ address }) {
    return address;
  },

  isContract: {
    async resolve({ address }, _args, { provider }) {
      const code = await provider.getCode(address);
      const parsedCode = ethers.utils.arrayify(code);
      return !!parsedCode.length;
    },
  },

  resolvedName: {
    resolve(address) {
      return address;
    },
  },
};

export type ResolvedNameModel = {
  address: string;
  resolvedName?: string | null;
};

export const ResolvedName: ResolvedNameResolvers = {
  async name({ address, resolvedName }, _args, { ethProvider }) {
    if (typeof resolvedName !== "undefined") {
      return resolvedName;
    }

    return await resolveNameFromAddress(address, ethProvider);
  },

  address({ address }) {
    return address;
  },
};

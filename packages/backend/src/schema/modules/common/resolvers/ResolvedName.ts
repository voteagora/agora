import { Address } from "viem";

import { Resolvers } from "../module";

export type ResolvedNameModel = {
  address: string;
  resolvedName?: string | null;
};

export const ResolvedName: Resolvers["ResolvedName"] = {
  async name({ address, resolvedName }, _args, { nameResolver }) {
    if (typeof resolvedName !== "undefined") {
      return resolvedName;
    }

    return await nameResolver.resolveNameFromAddress(address as Address);
  },

  address({ address }) {
    return address;
  },
};

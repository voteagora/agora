import { ethers } from "ethers";

import { Resolvers } from "../module";

export type AddressModel = {
  address: string;
};

export const Address: Resolvers["Address"] = {
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

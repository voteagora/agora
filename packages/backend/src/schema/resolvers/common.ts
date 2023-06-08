import {
  AddressResolvers,
  BlockResolvers,
  ResolvedNameResolvers,
  TransactionResolvers,
} from "./generated/types";
import { ethers, BigNumber } from "ethers";
import { resolveNameFromAddress } from "../../utils/resolveName";

import { TransactionResponse } from "@ethersproject/abstract-provider/src.ts";

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

export type TransactionModel = TransactionResponse;

export const Transaction: TransactionResolvers = {
  id({ hash }) {
    return `Transaction:${hash}`;
  },

  hash({ hash }) {
    return hash;
  },

  async block({ blockHash }, _args, { provider }) {
    return await provider.getBlock(blockHash!);
  },
};

export type BlockModel = ethers.providers.Block;

export const Block: BlockResolvers = {
  id({ hash }) {
    return `Block:${hash}`;
  },

  number({ number }) {
    return BigNumber.from(number);
  },

  timestamp({ timestamp }) {
    return new Date(timestamp * 1000);
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

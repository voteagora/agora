import { Resolvers } from "../module";

export type TokenAmountModel = bigint;

const amountSpec = {
  currency: "NOUN",
  decimals: 0,
};

export const TokenAmount: Resolvers["TokenAmount"] = {
  amount(value) {
    return value;
  },

  decimals() {
    return amountSpec.decimals;
  },

  currency() {
    return amountSpec.currency;
  },
};

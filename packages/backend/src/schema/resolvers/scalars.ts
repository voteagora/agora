import { GraphQLScalarType } from "graphql";
import { ethers } from "ethers";

export const BigInt = new GraphQLScalarType<ethers.BigNumber, string>({
  name: "BigInt",
  serialize(value) {
    if (!ethers.BigNumber.isBigNumber(value)) {
      throw new Error("failed to serialize BigNumber");
    }

    return value.toString();
  },
  parseValue(raw) {
    return ethers.BigNumber.from(raw as any);
  },
});

export const Timestamp = new GraphQLScalarType({
  name: "Timestamp",
  serialize(value) {
    if (!(value instanceof Date)) {
      throw new Error("unable to serialize value");
    }

    return +value;
  },
  parseValue(value) {
    if (typeof value !== "string" && typeof value !== "number") {
      throw new Error("failed to parse");
    }

    return new Date(value);
  },
});

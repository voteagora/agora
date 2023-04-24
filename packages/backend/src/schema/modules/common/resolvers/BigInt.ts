import { GraphQLScalarType } from "graphql";

export const BigIntScalarType = new GraphQLScalarType<bigint, string>({
  name: "BigInt",
  serialize(value) {
    if (typeof value !== "bigint") {
      throw new Error("failed to serialize bigint");
    }

    return value.toString();
  },
  parseValue(raw) {
    return BigInt(raw as any);
  },
});

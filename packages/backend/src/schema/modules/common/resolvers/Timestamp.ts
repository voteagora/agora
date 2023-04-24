import { GraphQLScalarType } from "graphql";

export const TimestampScalarType = new GraphQLScalarType({
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

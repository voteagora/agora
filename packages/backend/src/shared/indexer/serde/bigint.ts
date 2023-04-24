import { SerDe } from "./types";

export const bigint: SerDe<bigint, string> = {
  serialize(item: bigint): string {
    return item.toString();
  },
  deserialize(serialized: string): bigint {
    return BigInt(serialized);
  },
};

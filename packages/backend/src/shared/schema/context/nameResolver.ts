import { Address } from "viem";

export type NameResolver = {
  resolveAddress(name: string): Promise<Address | null>;
  resolveNameFromAddress(address: Address): Promise<string | null>;
};

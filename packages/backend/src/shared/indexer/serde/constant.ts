import { De } from "./types";

export function constantDe<T>(value: T): De<T, any> {
  return {
    deserialize(serialized: any): T {
      return value;
    },
  };
}

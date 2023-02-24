import { SerDe } from "./types";

export const number = passthrough<number>();

export const string = passthrough<string>();

export function passthrough<T>(): SerDe<T, T> {
  return {
    serialize(item) {
      return item;
    },
    deserialize(serialized) {
      return serialized;
    },
  };
}

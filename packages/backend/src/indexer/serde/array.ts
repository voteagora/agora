import { RuntimeType, SerDe, SerializedType } from "./types";

export function array<Item extends SerDe<any, any>>(
  item: Item
): SerDe<RuntimeType<Item>[], SerializedType<Item>[]> {
  return {
    serialize(value) {
      return value.map((it) => item.serialize(it));
    },
    deserialize(serialized) {
      return serialized.map((it) => item.deserialize(it));
    },
  };
}

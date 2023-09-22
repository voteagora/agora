import { SerDe } from "./types";

export function nullable<T, TSerialized>(
  serde: SerDe<T, TSerialized>
): SerDe<T | null, TSerialized | null> {
  return {
    serialize(item: T | null): TSerialized | null {
      return item === null ? null : serde.serialize(item);
    },
    deserialize(serialized: TSerialized | null): T | null {
      return serialized === null ? null : serde.deserialize(serialized);
    },
  };
}

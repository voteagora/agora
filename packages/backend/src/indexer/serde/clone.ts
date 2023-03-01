import { SerDe } from "./types";
import { cloneDeep } from "lodash";

/**
 * Type which can be safely JSON.stringify-ed and JSON.parsed without data being
 * lost.
 */
export type JsonRawType =
  | string
  | number
  | boolean
  | null
  | JsonRawType[]
  | { [key: string]: JsonRawType };

export function cloneSerdeValue<T, TSerialized extends JsonRawType>(
  serde: SerDe<T, TSerialized>,
  value: T
): T {
  return serde.deserialize(cloneDeep(serde.serialize(value)));
}

import { ethers } from "ethers";

interface Ser<T, TSerialized> {
  serialize(item: T): TSerialized;
}

interface De<T, TSerialized> {
  deserialize(serialized: TSerialized): T;
}

export interface SerDe<T, TSerialized>
  extends Ser<T, TSerialized>,
    De<T, TSerialized> {}

export type RuntimeType<T extends SerDe<any, any>> = T extends SerDe<
  infer T,
  any
>
  ? T
  : never;

export type SerializedType<T extends Ser<any, any>> = T extends SerDe<
  any,
  infer TSerialized
>
  ? TSerialized
  : never;

export function object<ObjectSpec extends { [key: string]: SerDe<any, any> }>(
  spec: ObjectSpec
): SerDe<
  { [K in keyof ObjectSpec]: RuntimeType<ObjectSpec[K]> },
  { [K in keyof ObjectSpec]: SerializedType<ObjectSpec[K]> }
> {
  return {
    serialize(item) {
      return Object.fromEntries(
        Object.entries(spec).map(([key, value]) => [
          key,
          value.serialize(item[key]),
        ])
      ) as any;
    },
    deserialize(serialized) {
      return Object.fromEntries(
        Object.entries(spec).map(([key, value]) => {
          return [key, value.deserialize(serialized[key])];
        })
      ) as any;
    },
  };
}

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

export const bigNumber: SerDe<ethers.BigNumber, string> = {
  serialize(item) {
    return item.toString();
  },

  deserialize(serialized) {
    return ethers.BigNumber.from(serialized);
  },
};

export const number = passthrough<number>();

export const string = passthrough<string>();

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

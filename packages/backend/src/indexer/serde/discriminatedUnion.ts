import { RuntimeType, SerDe, SerializedType } from "./types";

type DiscriminatedUnionDefinitionType = {
  [key: string]: SerDe<any, any>;
};

export type DiscriminatedUnionRuntimeType<
  Key extends string,
  Kind extends SerDe<any, any>
> = {
  key: Key;
  kind: RuntimeType<Kind>;
};

export type DiscriminatedUnionSerializedType<
  Key extends string,
  Kind extends SerDe<any, any>
> = {
  key: Key;
  kind: SerializedType<Kind>;
};

export type DiscriminatedUnionSerDe<
  Definition extends DiscriminatedUnionDefinitionType
> = SerDe<
  {
    [K in keyof Definition & string]: DiscriminatedUnionRuntimeType<
      K,
      Definition[K]
    >;
  }[keyof Definition & string],
  {
    [K in keyof Definition & string]: DiscriminatedUnionSerializedType<
      K,
      Definition[K]
    >;
  }[keyof Definition & string]
>;

export function discriminatedUnion<T extends DiscriminatedUnionDefinitionType>(
  unionDefinitions: T
): DiscriminatedUnionSerDe<T> {
  return {
    deserialize(serialized) {
      const serde = unionDefinitions[serialized.key];
      return {
        key: serialized.key,
        kind: serde.deserialize(serialized.kind),
      };
    },
    serialize(deserialized) {
      const serde = unionDefinitions[deserialized.key];

      return {
        key: deserialized.key,
        kind: serde.serialize(deserialized.kind),
      };
    },
  };
}

export type DiscriminatedUnionResolverRuntimeType<
  T extends DiscriminatedUnionDefinitionType,
  K extends keyof T & string
> = DiscriminatedUnionRuntimeType<K, T[K]>;

export interface Ser<T, TSerialized> {
  serialize(item: T): TSerialized;
}

export interface De<T, TSerialized> {
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

export type SerRuntimeType<T extends Ser<any, any>> = T extends Ser<
  infer T,
  any
>
  ? T
  : never;

export type DeRuntimeType<T extends De<any, any>> = T extends De<infer T, any>
  ? T
  : never;

export type SerializedType<T extends SerDe<any, any>> = T extends SerDe<
  any,
  infer TSerialized
>
  ? TSerialized
  : never;

export type SerSerializedType<T extends Ser<any, any>> = T extends Ser<
  any,
  infer TSerialized
>
  ? TSerialized
  : never;

export type DeSerializedType<T extends De<any, any>> = T extends De<
  any,
  infer TSerialized
>
  ? TSerialized
  : never;

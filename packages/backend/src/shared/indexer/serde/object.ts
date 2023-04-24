import {
  De,
  DeRuntimeType,
  DeSerializedType,
  RuntimeType,
  Ser,
  SerDe,
  SerializedType,
  SerRuntimeType,
  SerSerializedType,
} from "./types";

export function objectDe<ObjectSpec extends { [key: string]: De<any, any> }>(
  spec: ObjectSpec
): De<
  { [K in keyof ObjectSpec]: DeRuntimeType<ObjectSpec[K]> },
  { [K in keyof ObjectSpec]: DeSerializedType<ObjectSpec[K]> }
> {
  return {
    deserialize(serialized) {
      return Object.fromEntries(
        Object.entries(spec).map(([key, value]) => {
          return [key, value.deserialize(serialized[key])];
        })
      ) as any;
    },
  };
}

export function objectSer<ObjectSpec extends { [key: string]: Ser<any, any> }>(
  spec: ObjectSpec
): Ser<
  { [K in keyof ObjectSpec]: SerRuntimeType<ObjectSpec[K]> },
  { [K in keyof ObjectSpec]: SerSerializedType<ObjectSpec[K]> }
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
  };
}

type SerDeObject<ObjectSpec extends { [key: string]: SerDe<any, any> }> = SerDe<
  { [K in keyof ObjectSpec]: RuntimeType<ObjectSpec[K]> },
  { [K in keyof ObjectSpec]: SerializedType<ObjectSpec[K]> }
> & {
  extend<NewSpec extends { [key: string]: SerDe<any, any> }>(
    newSpec: NewSpec
  ): SerDeObject<ObjectSpec & NewSpec>;
};

export function object<ObjectSpec extends { [key: string]: SerDe<any, any> }>(
  spec: ObjectSpec
): SerDeObject<ObjectSpec> {
  return {
    ...objectSer(spec),
    ...objectDe(spec),
    extend(newSpec: { [key: string]: SerDe<any, any> }) {
      return object({
        ...spec,
        ...newSpec,
      });
    },
  } as any;
}

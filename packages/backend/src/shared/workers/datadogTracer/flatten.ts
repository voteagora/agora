type MetaInputType = {
  [key: string]: PrimitiveType;
};

type PrimitiveType =
  | string
  | undefined
  | null
  | number
  | MetaInputType
  | PrimitiveType[];

/**
 * Flattens nested objects and arrays into a single level deep structure with
 * keys joined by "."
 *
 * Used for datadog tracer meta tags.
 */
export function flattenMetaInputType(
  input: MetaInputType
): Record<string, string | undefined> {
  return Object.fromEntries(
    Array.from(flattenMetaInputTypeGen(input)).map(([key, value]) => [
      key.join("."),
      value,
    ])
  );
}

function* flattenMetaInputTypeGen(
  input: MetaInputType
): Generator<[string[], string | undefined]> {
  for (const [key, value] of Object.entries(input)) {
    for (const [innerKey, innerValue] of flattenPrimitiveValueGen(value)) {
      yield [[key, ...innerKey], innerValue];
    }
  }
}

function* flattenPrimitiveValueGen(
  value: PrimitiveType
): Generator<[string[], string | undefined]> {
  if (typeof value === "undefined") {
  } else if (value === null) {
  } else if (typeof value === "string") {
    yield [[], value];
  } else if (typeof value === "number") {
    yield [[], value.toString()];
  } else if (Array.isArray(value)) {
    for (const [arrayKey, arrayValue] of value.entries()) {
      for (const [innerKey, innerValue] of flattenPrimitiveValueGen(
        arrayValue
      )) {
        yield [[arrayKey.toString(), ...innerKey], innerValue];
      }
    }
  } else if (typeof value === "object") {
    yield* flattenMetaInputTypeGen(value);
  }
}

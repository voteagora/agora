export function requiredValue(
  record: Record<string, string | undefined>,
  key: string
): string {
  const retrievedValue = record[key];
  if (typeof retrievedValue === "undefined") {
    throw new Error(`value for process.env.${key} is undefined`);
  }

  return retrievedValue;
}

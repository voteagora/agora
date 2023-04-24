export function insertBetween<T>(items: T[], item: T): T[] {
  return items.flatMap((value, index, values) => {
    if (index === values.length - 1) {
      return [value];
    }

    return [value, item];
  });
}

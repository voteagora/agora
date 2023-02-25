export function countUnique<T>(items: T[]): number {
  const set = new Set(items);
  return set.size;
}

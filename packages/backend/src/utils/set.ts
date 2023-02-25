export function intersection<T>(lhs: Set<T>, rhs: Set<T>): Set<T> {
  return new Set([...Array.from(lhs)].filter((element) => rhs.has(element)));
}

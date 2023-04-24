export function intersection<T>(lhs: Set<T>, rhs: Set<T>): Set<T> {
  return new Set([...Array.from(lhs)].filter((element) => rhs.has(element)));
}

export function unionItems(lhs: bigint[], rhs: bigint[]): bigint[] {
  return [
    ...lhs,
    ...rhs.filter((rhsItem) => !lhs.find((lhsItem) => lhsItem === rhsItem)),
  ];
}

export function subtractItems(lhs: bigint[], rhs: bigint[]): bigint[] {
  return lhs.filter((lhsItem) => !rhs.find((rhsItem) => rhsItem === lhsItem));
}

export function compareBy<T>(by: (it: T) => any): Comparator<T> {
  return (lhsValue, rhsValue) => {
    const lhs = by(lhsValue);
    const rhs = by(rhsValue);

    return compare(lhs, rhs);
  };
}

export function compareByTuple<T, Tuple extends any[]>(
  by: (it: T) => [any, ...Tuple]
): Comparator<T> {
  return (lhsValue, rhsValue) => {
    const lhs = by(lhsValue);
    const rhs = by(rhsValue);

    return compareTuple(lhs, rhs);
  };
}

export type Comparator<T> = (a: T, b: T) => number;

function compare<T>(lhs: T, rhs: T): number {
  return lhs < rhs ? -1 : lhs > rhs ? 1 : 0;
}

export function compareTuple<T extends any[]>(
  lhs: readonly [any, ...T],
  rhs: [any, ...T]
): number {
  for (let idx = 0; idx < lhs.length; idx++) {
    const compareResult = compare(lhs[idx], rhs[idx]);
    if (compareResult !== 0) {
      return compareResult;
    }
  }

  return 0;
}

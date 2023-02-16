export type Comparator<T> = (a: T, b: T) => number;

export function descendingValueComparator<T>(
  getValueFor: (item: T) => number
): Comparator<T> {
  return (a, b) => {
    const aValue = getValueFor(a);
    const bValue = getValueFor(b);

    return bValue - aValue;
  };
}

export function flipComparator<T>(toFlip: Comparator<T>): Comparator<T> {
  return (a, b) => toFlip(b, a);
}

export function compareBy<T>(by: (it: T) => any): Comparator<T> {
  return (lhsValue, rhsValue) => {
    const lhs = by(lhsValue);
    const rhs = by(rhsValue);

    return compare(lhs, rhs);
  };
}

function compare<T>(lhs: T, rhs: T): number {
  return lhs < rhs ? -1 : lhs > rhs ? 1 : 0;
}

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

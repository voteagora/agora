export function ascendingValueComparator<T>(
  getValueFor: (item: T) => number
): (a: T, b: T) => number {
  return (a, b) => {
    const aValue = getValueFor(a);
    const bValue = getValueFor(b);

    return bValue - aValue;
  };
}

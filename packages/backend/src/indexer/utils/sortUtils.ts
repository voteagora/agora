export function sortBy<T>(aValue: T, bValue: T, by: (it: T) => any) {
  const a = by(aValue);
  const b = by(bValue);

  return a < b ? -1 : a > b ? 1 : 0;
}

export function compareBy<T>(by: (it: T) => any): (a: T, B: T) => number {
  return (a, b) => {
    return sortBy(a, b, by);
  };
}

export function findLastIndex<T>(items: T[], check: (item: T) => boolean) {
  const reversed = items.slice().reverse();
  const idx = reversed.findIndex((it) => check(it));
  if (idx === -1) {
    return -1;
  }

  return items.length - 1 - idx;
}

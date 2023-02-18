export interface PageSizeCalculator {
  recordFailure(): void;
  recordSuccess(): void;
  getPageSize(): number;
}

export function defaultPageSizeCalculator() {
  let pageSize = 10_000;
  return {
    recordFailure() {
      pageSize /= 2;
    },

    recordSuccess() {
      pageSize += 10;
    },

    getPageSize() {
      return pageSize;
    },
  };
}

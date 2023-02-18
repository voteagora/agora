export interface PageSizeCalculator {
  recordFailure(): void;
  recordSuccess(): void;
  getPageSize(): number;
}

const minPageSize = 2_000;

export function defaultPageSizeCalculator() {
  let pageSize = 2_000;

  return {
    recordFailure() {
      pageSize /= 2;
    },

    recordSuccess() {
      pageSize = pageSize + 10;
    },

    getPageSize() {
      return Math.max(pageSize, minPageSize);
    },
  };
}

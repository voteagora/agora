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
      pageSize /= Math.floor(pageSize / 2);
    },

    recordSuccess() {
      pageSize = Math.floor(pageSize * 1.2);
    },

    getPageSize() {
      return Math.max(pageSize, minPageSize);
    },
  };
}

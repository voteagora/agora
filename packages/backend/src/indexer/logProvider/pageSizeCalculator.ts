export interface PageSizeCalculator {
  recordFailure(): void;
  recordSuccess(): void;
  getPageSize(): number;
}

const minPageSize = 2_000;
const maxPageSize = 10_000;

export function defaultPageSizeCalculator() {
  let pageSize = 2_000;

  return {
    recordFailure() {
      pageSize = Math.max(pageSize / 2, minPageSize);
    },

    recordSuccess() {
      pageSize = Math.min(pageSize + 10, maxPageSize);
    },

    getPageSize() {
      return pageSize;
    },
  };
}

/**
 * Calculates page size to fetch based on prior failures and successes.
 * Inspired by algorithms used for [TCP Congestion Control](https://en.wikipedia.org/wiki/TCP_congestion_control).
 */
export interface PageSizeCalculator {
  recordFailure(): void;
  recordSuccess(): void;
  getPageSize(): number;
}

const minPageSize = 2_000;

/**
 * A page size calculator built for [Alchemy's `eth_getLogs`](https://docs.alchemy.com/reference/eth-getlogs)
 * log limits.
 *
 * * Starts at 2k (an amount which will always succeed)
 * * Increases page size by 20% for every successful response
 * * Halves page size for every failed response
 * * If internal page size is less than 2k, returns 2k
 */
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

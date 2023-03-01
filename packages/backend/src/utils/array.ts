import { BigNumber } from "ethers";

export function findLastIndex<T>(items: T[], check: (item: T) => boolean) {
  const reversed = items.slice().reverse();
  const idx = reversed.findIndex((it) => check(it));
  if (idx === -1) {
    return -1;
  }

  return items.length - 1 - idx;
}

export function countConsecutiveValues(
  values: ReadonlyArray<BigNumber>
): number {
  const sortedValues = values.slice().sort((a, b) => (a.gt(b) ? -1 : 1));

  let consecutiveValues = 0;
  for (const [idx, value] of sortedValues.entries()) {
    const lastProposalVote = sortedValues[idx + 1];
    if (lastProposalVote && lastProposalVote.add(1).eq(value)) {
      consecutiveValues++;
    } else {
      return consecutiveValues + 1;
    }
  }

  return 0;
}

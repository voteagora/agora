export function countConsecutiveValues(values: bigint[]): number {
  const sortedValues = values.slice().sort().reverse();

  let consecutiveValues = 0;
  for (const [idx, value] of sortedValues.entries()) {
    const lastProposalVote = sortedValues[idx + 1];
    if (lastProposalVote && lastProposalVote + 1n === value) {
      consecutiveValues++;
    } else {
      return consecutiveValues + 1;
    }
  }

  return 0;
}

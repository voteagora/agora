import { BigNumber } from "ethers";
import { format } from "date-fns";

export function pluralizeNoun(count: BigNumber) {
  if (count.eq(1)) {
    return `1 noun`;
  } else {
    return `${count.toString()} nouns`;
  }
}

export function pluralizeVote(count: BigNumber) {
  if (count.eq(1)) {
    return `1 vote`;
  } else {
    return `${count.toString()} votes`;
  }
}

export function pluralizeProb(count: BigNumber) {
  if (count.eq(1)) {
    return `1 prop`;
  } else {
    return `${count.toString()} props`;
  }
}

export function pluralizeAddresses(count: number) {
  if (count === 1) {
    return "1 address";
  }

  return `${count} addresses`;
}

export function pluralizeDelegations(count: number) {
  if (count === 1) {
    return `1 delegation`;
  }

  return `${count} delegations`;
}

export function pluralizeOther(count: number) {
  if (count === 1) {
    return "1 other";
  } else {
    return `${count} others`;
  }
}

export function formatDate(date: Date) {
  return format(date, "Pp");
}

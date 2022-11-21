import { BigNumber } from "ethers";

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
  } else {
    return `${count} addresses`;
  }
}

export function pluralizeOther(count: number) {
  if (count === 1) {
    return "1 other";
  } else {
    return `${count} others`;
  }
}

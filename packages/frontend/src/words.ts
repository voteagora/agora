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

const format = new Intl.NumberFormat("en", {
  style: "decimal",
  maximumSignificantDigits: 3,
  notation: "compact",
});

export function pluralizeAddresses(count: number) {
  if (count === 1) {
    return "1 address";
  } else {
    return `${format.format(count).toLowerCase()} addresses`;
  }
}

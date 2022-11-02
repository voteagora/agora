import { BigNumber } from "ethers";

const format = new Intl.NumberFormat("en", {
  style: "decimal",
  maximumSignificantDigits: 3,
  notation: "compact",
});

export function pluralizeVote(count: BigNumber, decimals: number) {
  const votes = count.div(BigNumber.from(10).pow(decimals));

  if (count.eq(1)) {
    return `1 vote`;
  } else {
    return `${format
      .formatToParts(votes.toBigInt())
      .map((it) => it.value)
      .join("")} votes`;
  }
}

export function pluralizeAddresses(count: number) {
  if (count === 1) {
    return "1 address";
  } else {
    return `${format.format(count).toLowerCase()} addresses`;
  }
}

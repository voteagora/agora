import { BigNumber } from "ethers";

export function intersection<T>(lhs: Set<T>, rhs: Set<T>): Set<T> {
  return new Set([...Array.from(lhs)].filter((element) => rhs.has(element)));
}

export function unionItems(lhs: BigNumber[], rhs: BigNumber[]): BigNumber[] {
  return [
    ...lhs,
    ...rhs.filter((rhsItem) => !lhs.find((lhsItem) => lhsItem.eq(rhsItem))),
  ];
}

export function subtractItems(lhs: BigNumber[], rhs: BigNumber[]): BigNumber[] {
  return lhs.filter((lhsItem) => !rhs.find((rhsItem) => rhsItem.eq(lhsItem)));
}

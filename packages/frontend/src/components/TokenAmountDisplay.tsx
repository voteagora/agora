import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { TokenAmountDisplayFragment$key } from "./__generated__/TokenAmountDisplayFragment.graphql";
import { ethers } from "ethers";
import { useMemo } from "react";

export type Props = {
  fragment: TokenAmountDisplayFragment$key;
};

export function TokenAmountDisplay({ fragment }: Props) {
  const { amount, decimals, currency } = useFragment(
    graphql`
      fragment TokenAmountDisplayFragment on TokenAmount {
        amount
        decimals
        currency
      }
    `,
    fragment
  );

  const formattedNumber = useMemo(() => {
    const number = Number(ethers.utils.formatUnits(amount, decimals));

    const numberFormat = new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      currencyDisplay: "code",
      compactDisplay: "short",
      notation: "compact",
      maximumSignificantDigits: 5,
    });

    const parts = numberFormat.formatToParts(number);
    return parts
      .filter((part) => part.type !== "currency" && part.type !== "literal")
      .map((part) => part.value)
      .join("")
      .toLowerCase();
  }, [amount, decimals]);

  return (
    <>
      {formattedNumber} {currency}
    </>
  );
}

import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { TokenAmountDisplayFragment$key } from "./__generated__/TokenAmountDisplayFragment.graphql";
import { ethers } from "ethers";
import { useMemo } from "react";

export type Props = {
  fragment: TokenAmountDisplayFragment$key;
  maximumSignificantDigits?: number;
};

export function TokenAmountDisplay({
  fragment,
  maximumSignificantDigits = 5,
}: Props) {
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
      currency: "USD",
      currencyDisplay: "code",
      compactDisplay: "short",
      notation: "compact",
      maximumSignificantDigits,
    });

    const parts = numberFormat.formatToParts(number);
    return parts
      .filter((part) => part.type !== "currency" && part.type !== "literal")
      .map((part) => part.value)
      .join("");
  }, [amount, decimals, maximumSignificantDigits]);

  return (
    <>
      {formattedNumber} {currency}
    </>
  );
}

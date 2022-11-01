import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { TokenAmountDisplayFragment$key } from "./__generated__/TokenAmountDisplayFragment.graphql";
import { ethers } from "ethers";

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

  return (
    <>
      ${ethers.utils.formatUnits(amount, decimals)} ${currency}
    </>
  );
}

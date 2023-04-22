import graphql from "babel-plugin-relay/macro";
import { BigNumber } from "ethers";
import { useFragment } from "react-relay";

import { pluralizeNoun } from "../../../words";

import { PanelRow } from "./PanelRow";
import { TotalVotePowerRowFragment$key } from "./__generated__/TotalVotePowerRowFragment.graphql";

export type Props = {
  fragmentKey: TotalVotePowerRowFragment$key;
};

export function TotalVotePowerRow({ fragmentKey }: Props) {
  const {
    tokensRepresented: {
      amount: { amount },
    },
  } = useFragment(
    graphql`
      fragment TotalVotePowerRowFragment on Delegate {
        tokensRepresented {
          amount {
            amount
          }
        }
      }
    `,
    fragmentKey
  );

  return (
    <PanelRow
      title="Nouns represented"
      detail={pluralizeNoun(BigNumber.from(amount))}
    />
  );
}

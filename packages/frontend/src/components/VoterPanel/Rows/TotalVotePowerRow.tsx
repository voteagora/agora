import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { TotalVotePowerRowFragment$key } from "./__generated__/TotalVotePowerRowFragment.graphql";
import { PanelRow } from "./PanelRow";
import { pluralizeNoun } from "../../../words";
import { BigNumber } from "ethers";

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

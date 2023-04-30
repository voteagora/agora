import { useFragment, graphql } from "react-relay";
import { BigNumber } from "ethers";
import { useMemo } from "react";

import { pluralizeNoun } from "../../../words";

import { TotalVotePowerRowFragment$key } from "./__generated__/TotalVotePowerRowFragment.graphql";
import { PanelRow } from "./PanelRow";

export type Props = {
  fragmentKey: TotalVotePowerRowFragment$key;
};

export function TotalVotePowerRow({ fragmentKey }: Props) {
  const result = useFragment(
    graphql`
      fragment TotalVotePowerRowFragment on Delegate {
        totalTokensRepresented {
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
      detail={pluralizeNoun(
        BigNumber.from(result.totalTokensRepresented.amount.amount)
      )}
    />
  );
}

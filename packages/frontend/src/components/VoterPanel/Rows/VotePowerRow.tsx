import { useFragment, graphql } from "react-relay";

import { bpsToString } from "../../../utils/bps";

import { PanelRow } from "./PanelRow";
import { VotePowerRowFragment$key } from "./__generated__/VotePowerRowFragment.graphql";

export function VotePowerRow({
  fragment,
}: {
  fragment: VotePowerRowFragment$key;
}) {
  const { totalTokensRepresented } = useFragment(
    graphql`
      fragment VotePowerRowFragment on Delegate {
        totalTokensRepresented {
          bpsOfDelegatedSupply
          bpsOfQuorum
        }
      }
    `,
    fragment
  );

  return (
    <PanelRow
      title="Vote Power"
      detail={
        !totalTokensRepresented ? (
          "None"
        ) : (
          <>
            {bpsToString(totalTokensRepresented.bpsOfDelegatedSupply)} all /{" "}
            {bpsToString(totalTokensRepresented.bpsOfQuorum)} quorum
          </>
        )
      }
    />
  );
}

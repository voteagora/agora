import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";

import { bpsToString } from "../../../utils/bps";

import { PanelRow } from "./PanelRow";
import { VotePowerRowFragment$key } from "./__generated__/VotePowerRowFragment.graphql";

export function VotePowerRow({
  fragment,
}: {
  fragment: VotePowerRowFragment$key;
}) {
  const { tokensRepresented } = useFragment(
    graphql`
      fragment VotePowerRowFragment on Delegate {
        tokensRepresented {
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
        !tokensRepresented ? (
          "None"
        ) : (
          <>
            {bpsToString(tokensRepresented.bpsOfDelegatedSupply)} all /{" "}
            {bpsToString(tokensRepresented.bpsOfQuorum)} quorum
          </>
        )
      }
    />
  );
}

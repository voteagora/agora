import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { PanelRow } from "./PanelRow";
import { VotePowerRowFragment$key } from "./__generated__/VotePowerRowFragment.graphql";
import { bpsToString } from "../../../utils/bps";

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
          "N/A"
        ) : (
          <>
            {bpsToString(tokensRepresented.bpsOfDelegatedSupply)} votable supply
            <br />
            {bpsToString(tokensRepresented.bpsOfQuorum)} quorum
          </>
        )
      }
    />
  );
}

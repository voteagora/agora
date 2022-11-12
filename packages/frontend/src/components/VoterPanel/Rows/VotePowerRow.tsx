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
          bpsOfTotal
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
        !tokensRepresented
          ? "N/A"
          : `${bpsToString(tokensRepresented.bpsOfTotal)} all / ${bpsToString(
              tokensRepresented.bpsOfQuorum
            )} quorum`
      }
    />
  );
}

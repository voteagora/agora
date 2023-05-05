import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { PanelRow } from "./PanelRow";
import { DelegatingToRowFragment$key } from "./__generated__/DelegatingToRowFragment.graphql";
import { shortAddress } from "../../../utils/address";

export function DelegatingTo({
  fragment,
}: {
  fragment: DelegatingToRowFragment$key;
}) {
  const delegate = useFragment(
    graphql`
      fragment DelegatingToRowFragment on Delegate {
        delegatingTo {
          address {
            resolvedName {
              address
              name
            }
          }
        }
      }
    `,
    fragment
  );

  let delegatingTo =
    delegate.delegatingTo &&
    delegate.delegatingTo.address &&
    delegate.delegatingTo.address.resolvedName;

  return (
    <PanelRow
      title="Delegated to"
      detail={delegatingTo.name || shortAddress(delegatingTo.address) || ""}
    />
  );
}

import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { PanelRow } from "./PanelRow";
import { DelegateFromListRowFragment$key } from "./__generated__/DelegateFromListRowFragment.graphql";
import { pluralizeAddresses } from "../../../words";

export function DelegateFromList({
  fragment,
}: {
  fragment: DelegateFromListRowFragment$key;
}) {
  const { tokenHoldersRepresentedCount } = useFragment(
    graphql`
      fragment DelegateFromListRowFragment on DelegateMetrics {
        tokenHoldersRepresentedCount
      }
    `,
    fragment
  );

  return (
    <PanelRow
      title="Delegated from"
      detail={pluralizeAddresses(tokenHoldersRepresentedCount ?? 0)}
    />
  );
}

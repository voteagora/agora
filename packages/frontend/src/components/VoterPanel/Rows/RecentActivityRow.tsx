import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { PanelRow } from "./PanelRow";
import { RecentActivityRowFragment$key } from "./__generated__/RecentActivityRowFragment.graphql";

export function RecentActivityRow({
  fragment,
}: {
  fragment: RecentActivityRowFragment$key;
}) {
  const { ofLastTenProps } = useFragment(
    graphql`
      fragment RecentActivityRowFragment on DelegateMetrics {
        ofLastTenProps
      }
    `,
    fragment
  );

  return (
    <PanelRow
      title="Recent activity"
      detail={ofLastTenProps ? `${ofLastTenProps} of 10 last props` : "N/A"}
    />
  );
}

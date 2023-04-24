import { useFragment, graphql } from "react-relay";

import { PanelRow } from "./PanelRow";
import { RecentActivityRowFragment$key } from "./__generated__/RecentActivityRowFragment.graphql";

export function RecentActivityRow({
  fragment,
}: {
  fragment: RecentActivityRowFragment$key;
}) {
  const { delegateMetrics } = useFragment(
    graphql`
      fragment RecentActivityRowFragment on Delegate {
        delegateMetrics {
          ofLastTenProps
        }
      }
    `,
    fragment
  );

  return (
    <PanelRow
      title="Recent activity"
      detail={
        delegateMetrics.ofLastTenProps
          ? `${delegateMetrics.ofLastTenProps} of 10 last props`
          : "N/A"
      }
    />
  );
}

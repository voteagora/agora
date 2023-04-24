import { useFragment, graphql } from "react-relay";

import { PanelRow } from "./PanelRow";
import { ProposalsVotedRowFragment$key } from "./__generated__/ProposalsVotedRowFragment.graphql";

export function ProposalsVotedRow({
  fragment,
}: {
  fragment: ProposalsVotedRowFragment$key;
}) {
  const { delegateMetrics } = useFragment(
    graphql`
      fragment ProposalsVotedRowFragment on Delegate {
        delegateMetrics {
          totalVotes
          ofTotalProps
        }
      }
    `,
    fragment
  );

  return (
    <PanelRow
      title="Proposals voted"
      detail={
        !delegateMetrics
          ? "None"
          : `${delegateMetrics.totalVotes} (${delegateMetrics.ofTotalProps}%)`
      }
    />
  );
}

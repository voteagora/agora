import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { PanelRow } from "./PanelRow";
import { ForAgainstAbstainRowFragment$key } from "./__generated__/ForAgainstAbstainRowFragment.graphql";

export function ForAgainstAbstainRow({
  fragment,
}: {
  fragment: ForAgainstAbstainRowFragment$key;
}) {
  const { delegateMetrics } = useFragment(
    graphql`
      fragment ForAgainstAbstainRowFragment on Delegate {
        delegateMetrics {
          forVotes
          againstVotes
          abstainVotes
        }
      }
    `,
    fragment
  );

  return (
    <PanelRow
      title="For / Against / Abstain"
      detail={
        delegateMetrics
          ? `${delegateMetrics.forVotes} / ${delegateMetrics.againstVotes} / ${delegateMetrics.abstainVotes}`
          : "N/A"
      }
    />
  );
}

import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { PanelRow } from "./PanelRow";
import { ProposalsCreatedRowFragment$key } from "./__generated__/ProposalsCreatedRowFragment.graphql";

export function ProposalsCreatedRow({
  fragment,
}: {
  fragment: ProposalsCreatedRowFragment$key;
}) {
  const { proposalsCreated } = useFragment(
    graphql`
      fragment ProposalsCreatedRowFragment on DelegateMetrics {
        proposalsCreated
      }
    `,
    fragment
  );

  return (
    <PanelRow
      title="Proposals created"
      detail={`${proposalsCreated ?? "N/A"}`}
    />
  );
}

import { Selector, SelectorProps } from "../HomePage/Selector";
import { VotesOrder } from "../ProposalsPage/__generated__/ProposalsPageDetailQuery.graphql";

export function VoteSortSelector(
  props: Omit<SelectorProps<VotesOrder>, "items">
) {
  return (
    <Selector
      {...props}
      items={[
        {
          title: "Newest",
          value: "mostRecent" as const,
        },
        {
          title: "By Weight",
          value: "mostVotes" as const,
        },
      ]}
    />
  );
}

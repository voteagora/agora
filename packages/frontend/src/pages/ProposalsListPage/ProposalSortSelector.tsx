import { Selector, SelectorProps } from "../HomePage/Selector";

export type ProposalSortType = "NEWEST" | "OLDEST";

export function ProposalSortSelector(
  props: Omit<SelectorProps<ProposalSortType>, "items">
) {
  return (
    <Selector
      {...props}
      items={[
        {
          title: "Newest",
          value: "NEWEST" as const,
        },
        {
          title: "Oldest",
          value: "OLDEST" as const,
        },
      ]}
    />
  );
}

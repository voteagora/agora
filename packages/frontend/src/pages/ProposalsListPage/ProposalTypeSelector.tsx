import { Selector, SelectorProps } from "../HomePage/Selector";

export type ProposalTypeFilter = "ALL" | "ON_CHAIN" | "PROP_HOUSE_AUCTION";

export function ProposalTypeSelector(
  props: Omit<SelectorProps<ProposalTypeFilter>, "items">
) {
  return (
    <Selector
      {...props}
      items={[
        {
          title: "All types",
          value: "ALL" as const,
        },
        {
          title: "Onchain",
          value: "ON_CHAIN" as const,
        },
        {
          title: "Prop House",
          value: "PROP_HOUSE_AUCTION" as const,
        },
      ]}
    />
  );
}

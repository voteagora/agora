import { Selector, SelectorProps } from "../HomePage/Selector";

export type ProposalStatusFilter =
  | "ALL"
  | "PROPOSING"
  | "ACTIVE"
  | "EXECUTED"
  | "PENDING"
  | "CANCELLED"
  | "VETOED"
  | "QUEUED";

export function ProposalStatusSelector(
  props: Omit<SelectorProps<ProposalStatusFilter>, "items">
) {
  return (
    <Selector
      {...props}
      items={[
        {
          title: "All",
          value: "ALL" as const,
        },
        {
          title: "Proposing",
          value: "PROPOSING" as const,
        },
        {
          title: "Active",
          value: "ACTIVE" as const,
        },
        {
          title: "Pending",
          value: "PENDING" as const,
        },
        {
          title: "Cancelled",
          value: "CANCELLED" as const,
        },
        {
          title: "Executed",
          value: "EXECUTED" as const,
        },
        {
          title: "Defeated",
          value: "VETOED" as const,
        },
        {
          title: "Queued",
          value: "QUEUED" as const,
        },
      ]}
    />
  );
}

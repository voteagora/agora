import { useFragment, graphql } from "react-relay";
import React from "react";

import { formatDate } from "../../../../words";

import { TimeRuleFragment$key } from "./__generated__/TimeRuleFragment.graphql";

export function TimeRule({
  fragmentRef,
}: {
  fragmentRef: TimeRuleFragment$key;
}) {
  const rules = useFragment(
    graphql`
      fragment TimeRuleFragment on LiquidDelegationRules {
        notValidAfter
        notValidBefore
      }
    `,
    fragmentRef
  );

  if (rules.notValidBefore && rules.notValidAfter) {
    return (
      <div>
        Active {formatDate(new Date(rules.notValidBefore))} -{" "}
        {formatDate(new Date(rules.notValidAfter))}
      </div>
    );
  }

  if (rules.notValidAfter) {
    const date = new Date(rules.notValidAfter);

    return <div>Active till {formatDate(date)}</div>;
  }

  if (rules.notValidBefore) {
    const date = new Date(rules.notValidBefore);

    return <div>Active from {formatDate(date)}</div>;
  }

  return null;
}

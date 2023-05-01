import { useFragment, graphql } from "react-relay";
import React from "react";

import { RedelegationRuleFragment$key } from "./__generated__/RedelegationRuleFragment.graphql";

export function RedelegationRule({
  fragmentRef,
}: {
  fragmentRef: RedelegationRuleFragment$key;
}) {
  const rules = useFragment(
    graphql`
      fragment RedelegationRuleFragment on LiquidDelegationRules {
        maxRedelegations
      }
    `,
    fragmentRef
  );

  if (rules.maxRedelegations === 0xff) {
    return <div>Unlimited redelegations</div>;
  }

  if (rules.maxRedelegations === 1) {
    return <div>Redelegation allowed once</div>;
  }

  if (rules.maxRedelegations === 0) {
    return <div>Redelegation disallowed</div>;
  }

  return <div>Redelegation allowed {rules.maxRedelegations} times</div>;
}

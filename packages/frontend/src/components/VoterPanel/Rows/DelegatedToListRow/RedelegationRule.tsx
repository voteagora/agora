import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
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
  } else if (rules.maxRedelegations === 1) {
    return <div>Redelegation allowed once</div>;
  } else {
    return <div>Redelegation disallowed</div>;
  }
}

import { useFragment, graphql } from "react-relay";
import React from "react";

import {
  PERMISSION_PROPOSE,
  PERMISSION_SIGN,
  PERMISSION_VOTE,
} from "../../../DelegateDialog/delegateRules";

import { PermissionsRuleFragment$key } from "./__generated__/PermissionsRuleFragment.graphql";

export function PermissionsRule({
  fragmentRef,
}: {
  fragmentRef: PermissionsRuleFragment$key;
}) {
  const rules = useFragment(
    graphql`
      fragment PermissionsRuleFragment on LiquidDelegationRules {
        permissionVote
        permissionSign
        permissionPropose
      }
    `,
    fragmentRef
  );

  return <div>{permissionsString(rules)}</div>;
}

export function permissionsString(rules: {
  permissionVote: boolean;
  permissionSign: boolean;
  permissionPropose: boolean;
}) {
  const permissions = Array.from(
    (function* () {
      if (rules.permissionVote) {
        yield "Vote";
      }

      if (rules.permissionSign) {
        yield "Vote on prop house";
      }

      if (rules.permissionPropose) {
        yield "Propose";
      }
    })()
  );

  return `Can ${permissions.join(", ")}`;
}

export function toPermissions(value: number) {
  return {
    permissionVote: !!(value & PERMISSION_VOTE),
    permissionSign: !!(value & PERMISSION_SIGN),
    permissionPropose: !!(value & PERMISSION_PROPOSE),
  };
}

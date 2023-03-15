import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";
import { VStack } from "../VStack";
import * as theme from "../../theme";
import { TimeRule } from "./Rows/DelegatedToListRow/TimeRule";
import { PermissionsRule } from "./Rows/DelegatedToListRow/PermissionsRule";
import { RedelegationRule } from "./Rows/DelegatedToListRow/RedelegationRule";
import { CustomRules } from "./Rows/DelegatedToListRow/CustomRules";
import { BlocksBeforeVoteClosesRule } from "./Rows/DelegatedToListRow/BlocksBeforeVoteClosesRule";
import React from "react";
import { LiquidDelegationRulesFragment$key } from "./__generated__/LiquidDelegationRulesFragment.graphql";
import { css } from "@emotion/css";

export function LiquidDelegationRules({
  fragmentRef,
}: {
  fragmentRef: LiquidDelegationRulesFragment$key;
}) {
  const rules = useFragment(
    graphql`
      fragment LiquidDelegationRulesFragment on LiquidDelegationRules {
        ...PermissionsRuleFragment
        ...RedelegationRuleFragment
        ...TimeRuleFragment
        ...CustomRulesFragment
        ...BlocksBeforeVoteClosesRuleFragment
      }
    `,
    fragmentRef
  );

  return (
    <VStack
      className={css`
        font-size: ${theme.fontSize.sm};
      `}
    >
      <TimeRule fragmentRef={rules} />
      <PermissionsRule fragmentRef={rules} />
      <RedelegationRule fragmentRef={rules} />
      <CustomRules fragmentRef={rules} />
      <BlocksBeforeVoteClosesRule fragmentRef={rules} />
    </VStack>
  );
}

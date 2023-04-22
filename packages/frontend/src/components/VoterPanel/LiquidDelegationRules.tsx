import { css } from "@emotion/css";
import graphql from "babel-plugin-relay/macro";
import React from "react";
import { useFragment } from "react-relay";

import * as theme from "../../theme";
import { VStack } from "../VStack";

import { BlocksBeforeVoteClosesRule } from "./Rows/DelegatedToListRow/BlocksBeforeVoteClosesRule";
import { CustomRules } from "./Rows/DelegatedToListRow/CustomRules";
import { PermissionsRule } from "./Rows/DelegatedToListRow/PermissionsRule";
import { RedelegationRule } from "./Rows/DelegatedToListRow/RedelegationRule";
import { TimeRule } from "./Rows/DelegatedToListRow/TimeRule";
import { LiquidDelegationRulesFragment$key } from "./__generated__/LiquidDelegationRulesFragment.graphql";

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
        font-size: ${theme.fontSize.xs};
        border-left: 1px solid ${theme.colors.gray[300]};
        padding-left: ${theme.spacing[2]};
        padding-top: ${theme.spacing[1]};
        padding-bottom: ${theme.spacing[1]};
        color: ${theme.colors.gray[700]};
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

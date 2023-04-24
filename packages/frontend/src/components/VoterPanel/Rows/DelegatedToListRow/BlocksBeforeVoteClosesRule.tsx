import { graphql, useFragment } from "react-relay";

import { BlocksBeforeVoteClosesRuleFragment$key } from "./__generated__/BlocksBeforeVoteClosesRuleFragment.graphql";

export function BlocksBeforeVoteClosesRule({
  fragmentRef,
}: {
  fragmentRef: BlocksBeforeVoteClosesRuleFragment$key;
}) {
  const rules = useFragment(
    graphql`
      fragment BlocksBeforeVoteClosesRuleFragment on LiquidDelegationRules {
        blocksBeforeVoteCloses
      }
    `,
    fragmentRef
  );

  if (!rules.blocksBeforeVoteCloses) {
    return null;
  }

  return (
    <div>{rules.blocksBeforeVoteCloses} blocks before on-chain vote closes</div>
  );
}

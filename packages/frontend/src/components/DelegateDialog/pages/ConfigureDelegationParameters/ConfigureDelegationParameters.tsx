import { graphql, useFragment } from "react-relay";

import { VStack } from "../../../VStack";
import { DelegationDisplay } from "../../DelegationDisplay";
import { NavigateDialogAction } from "../../DelegateDialog";

import { CommitDelegation } from "./CommitDelegation";
import { ConfigureDelegationParametersFragment$key } from "./__generated__/ConfigureDelegationParametersFragment.graphql";

export function ConfigureDelegationParameters({
  fragmentRef,
  navigateDialog,
}: {
  fragmentRef: ConfigureDelegationParametersFragment$key;
  navigateDialog: (action: NavigateDialogAction) => void;
}) {
  const result = useFragment(
    graphql`
      fragment ConfigureDelegationParametersFragment on Query
      @argumentDefinitions(
        currentAccountAddress: { type: "String!" }
        targetAccountAddress: { type: "String!" }
        skip: { type: "Boolean!" }
      ) {
        ...DelegationDisplayFragment
          @arguments(
            currentAccountAddress: $currentAccountAddress
            targetAccountAddress: $targetAccountAddress
            skip: $skip
          )
        ...CommitDelegationFragment
          @arguments(
            currentAccountAddress: $currentAccountAddress
            targetAccountAddress: $targetAccountAddress
            skip: $skip
          )
      }
    `,
    fragmentRef
  );

  return (
    <VStack gap="8" alignItems="stretch">
      <DelegationDisplay fragmentRef={result} />
      <CommitDelegation fragmentRef={result} navigateDialog={navigateDialog} />
    </VStack>
  );
}

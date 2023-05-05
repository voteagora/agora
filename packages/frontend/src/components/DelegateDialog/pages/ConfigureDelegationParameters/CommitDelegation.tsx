import { useState } from "react";
import { graphql, useFragment } from "react-relay";
import { BigNumber } from "ethers";
import isEqual from "lodash/isEqual";
import { ConnectKitButton } from "connectkit";
import { Address } from "@wagmi/core";

import { VStack } from "../../../VStack";
import {
  delegateRulesToContractState,
  DelegationContractState,
} from "../../delegateRules";
import { useDelegationContractState } from "../../useDelegationContractState";
import { actionsForDelegationState, useExecuteAction } from "../../action";
import { NavigateDialogAction } from "../../DelegateDialog";
import { DelegateButton } from "../../DelegateButton";
import { handlingError } from "../../../../hooks/useContractWrite";

import {
  existingContractStateIntoVotingScopeSetting,
  VotingScopeSelector,
  WrappedVotingScopeSetting,
} from "./CommitDelegation/VotingScopeSelector";
import {
  existingContractStateIntoRedelegationSetting,
  RedelegationSelector,
  WrappedRedelegationSetting,
} from "./CommitDelegation/RedelegationSelector";
import {
  existingContractStateIntoTimePeriodSetting,
  TimePeriodSelector,
  WrappedTimePeriodSetting,
} from "./CommitDelegation/TimePeriodSelector";
import { CommitDelegationContentsFragment$key } from "./__generated__/CommitDelegationContentsFragment.graphql";
import { CommitDelegationFragment$key } from "./__generated__/CommitDelegationFragment.graphql";

export function CommitDelegationContents({
  fragmentRef,
  existingDelegationContractState,
  navigateDialog,
}: {
  fragmentRef: CommitDelegationContentsFragment$key;
  existingDelegationContractState: DelegationContractState;
  navigateDialog: (action: NavigateDialogAction) => void;
}) {
  const { targetAccount, currentAccount } = useFragment(
    graphql`
      fragment CommitDelegationContentsFragment on Query
      @argumentDefinitions(
        targetAccountAddress: { type: "String!" }
        currentAccountAddress: { type: "String!" }
        skip: { type: "Boolean!" }
      ) {
        targetAccount: delegate(addressOrEnsName: $targetAccountAddress) {
          # eslint-disable-next-line relay/must-colocate-fragment-spreads
          ...LiquidDelegationStepTargetDelegateFragment

          address {
            resolvedName {
              address
            }
          }
        }

        currentAccount: delegate(addressOrEnsName: $currentAccountAddress)
          @skip(if: $skip) {
          address {
            resolvedName {
              address
            }
          }

          liquidDelegationProxyAddress {
            address
          }

          tokensOwned {
            amount {
              amount
            }
          }
        }
      }
    `,
    fragmentRef
  );

  const [timePeriodSetting, setTimePeriodSetting] =
    useState<WrappedTimePeriodSetting>(() =>
      existingContractStateIntoTimePeriodSetting(
        existingDelegationContractState
      )
    );

  const [redelegationSetting, setRedelegationSetting] =
    useState<WrappedRedelegationSetting>(() =>
      existingContractStateIntoRedelegationSetting(
        existingDelegationContractState
      )
    );

  const [votingScopeSetting, setVotingScopeSetting] =
    useState<WrappedVotingScopeSetting>(() =>
      existingContractStateIntoVotingScopeSetting(
        existingDelegationContractState
      )
    );

  const executeAction = useExecuteAction();

  if (!currentAccount) {
    return <DelegateButton>Connect Wallet</DelegateButton>;
  }

  const hasTokenVotingPower = !BigNumber.from(
    currentAccount.tokensOwned.amount.amount
  ).eq(0);

  const targetContractDelegationState = delegateRulesToContractState(
    {
      redelegation: redelegationSetting,
      timePeriod: timePeriodSetting,
      votingScope: votingScopeSetting,
    },
    hasTokenVotingPower
  );

  return (
    <VStack gap="2">
      <TimePeriodSelector
        value={timePeriodSetting}
        onChange={setTimePeriodSetting}
      />

      <RedelegationSelector
        value={redelegationSetting}
        onChange={setRedelegationSetting}
      />

      <VotingScopeSelector
        value={votingScopeSetting}
        onChange={setVotingScopeSetting}
      />

      {(() => {
        if (
          targetContractDelegationState.type === "TOKEN" &&
          existingDelegationContractState.type === "TOKEN"
        ) {
          return <DelegateButton>You're already delegated!</DelegateButton>;
        }

        if (
          isEqual(
            targetContractDelegationState,
            existingDelegationContractState
          )
        ) {
          return <DelegateButton>No changes</DelegateButton>;
        }

        const actions = actionsForDelegationState(
          targetContractDelegationState,
          existingDelegationContractState,
          targetAccount.address.resolvedName.address as Address,
          targetAccount,
          currentAccount.liquidDelegationProxyAddress.address as Address
        );

        if (!(actions.tokenDelegation || actions.liquidDelegation)) {
          return <DelegateButton>No changes</DelegateButton>;
        }

        return (
          <DelegateButton
            onClick={() =>
              handlingError(
                (async () => {
                  if (!actions.tokenDelegation || !actions.liquidDelegation) {
                    const action =
                      actions.tokenDelegation ?? actions.liquidDelegation;
                    if (!action) {
                      throw new Error("No action to execute");
                    }

                    await executeAction(action);

                    navigateDialog({ type: "CLOSE" });
                  } else {
                    navigateDialog({
                      type: "DELEGATE",
                      liquidDelegation: actions.liquidDelegation,
                      tokenDelegation: actions.tokenDelegation,
                    });
                  }
                })()
              )
            }
          >
            {(() => {
              switch (targetContractDelegationState.type) {
                case "TOKEN":
                  return "Delegate your nouns";

                case "LIQUID":
                  return "Liquid delegate your nouns";
              }
            })()}
          </DelegateButton>
        );
      })()}
    </VStack>
  );
}

export function CommitDelegation({
  fragmentRef,
  navigateDialog,
}: {
  fragmentRef: CommitDelegationFragment$key;
  navigateDialog: (action: NavigateDialogAction) => void;
}) {
  const result = useFragment(
    graphql`
      fragment CommitDelegationFragment on Query
      @argumentDefinitions(
        currentAccountAddress: { type: "String!" }
        targetAccountAddress: { type: "String!" }
        skip: { type: "Boolean!" }
      ) {
        ...useDelegationContractStateFragment
          @arguments(
            currentAccountAddress: $currentAccountAddress
            targetAccountAddress: $targetAccountAddress
            skip: $skip
          )

        ...CommitDelegationContentsFragment
          @arguments(
            currentAccountAddress: $currentAccountAddress
            targetAccountAddress: $targetAccountAddress
            skip: $skip
          )
      }
    `,
    fragmentRef
  );

  const existingDelegationContractState = useDelegationContractState(result);

  if (!existingDelegationContractState) {
    return (
      <ConnectKitButton.Custom>
        {({ show }) => (
          <DelegateButton onClick={() => show!()}>
            Connect Wallet
          </DelegateButton>
        )}
      </ConnectKitButton.Custom>
    );
  }

  return (
    <CommitDelegationContents
      fragmentRef={result}
      existingDelegationContractState={existingDelegationContractState}
      navigateDialog={navigateDialog}
    />
  );
}

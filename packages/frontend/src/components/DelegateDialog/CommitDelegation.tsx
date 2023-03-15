import { useContractWriteFn } from "../../hooks/useContractWrite";
import { nounsAlligator, nounsToken } from "../../contracts/contracts";
import { Alligator, NounsToken } from "../../contracts/generated";
import { ReactNode, useState } from "react";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import {
  delegateRulesToContractState,
  DelegationContractState,
} from "./delegateRules";
import { VStack } from "../VStack";
import { useDelegationContractState } from "./useDelegationContractState";
import {
  existingContractStateIntoTimePeriodSetting,
  TimePeriodSelector,
  WrappedTimePeriodSetting,
} from "./CommitDelegation/TimePeriodSelector";
import {
  existingContractStateIntoRedelegationSetting,
  RedelegationSelector,
  WrappedRedelegationSetting,
} from "./CommitDelegation/RedelegationSelector";
import {
  existingContractStateIntoVotingScopeSetting,
  VotingScopeSelector,
  WrappedVotingScopeSetting,
} from "./CommitDelegation/VotingScopeSelector";
import { BigNumber } from "ethers";
import { isEqual } from "lodash";
import { CommitDelegationContentsFragment$key } from "./__generated__/CommitDelegationContentsFragment.graphql";
import { CommitDelegationFragment$key } from "./__generated__/CommitDelegationFragment.graphql";
import { ConnectKitButton } from "connectkit";

export function CommitDelegationContents({
  fragmentRef,
  existingDelegationContractState,
  completeDelegation,
}: {
  fragmentRef: CommitDelegationContentsFragment$key;
  existingDelegationContractState: DelegationContractState;
  completeDelegation: () => void;
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

  const writeLiquidDelegate = useContractWriteFn<Alligator, "subDelegate">(
    nounsAlligator,
    "subDelegate"
  );

  const writeTokenDelegation = useContractWriteFn<NounsToken, "delegate">(
    nounsToken,
    "delegate"
  );

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

        return (
          <DelegateButton
            onClick={async () => {
              switch (targetContractDelegationState.type) {
                case "LIQUID": {
                  if (
                    (existingDelegationContractState.type === "TOKEN" ||
                      (existingDelegationContractState.type === "LIQUID" &&
                        !existingDelegationContractState.delegatedToLiquidContract)) &&
                    targetContractDelegationState.delegatedToLiquidContract
                  ) {
                    await writeTokenDelegation([
                      currentAccount.liquidDelegationProxyAddress.address,
                    ]);
                  }

                  if (targetContractDelegationState.rules) {
                    await writeLiquidDelegate([
                      targetAccount.address.resolvedName.address,
                      targetContractDelegationState.rules,
                      true,
                    ]);
                  }

                  break;
                }

                case "TOKEN": {
                  await writeTokenDelegation([
                    targetAccount.address.resolvedName.address,
                  ]);
                  break;
                }
              }

              completeDelegation();
            }}
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
  completeDelegation,
}: {
  fragmentRef: CommitDelegationFragment$key;
  completeDelegation: () => void;
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
      completeDelegation={completeDelegation}
    />
  );
}

type DelegateButtonProps = {
  onClick?: () => void;
  children: ReactNode;
};

const DelegateButton = ({ children, onClick }: DelegateButtonProps) => {
  return (
    <div
      onClick={onClick}
      className={css`
        text-align: center;
        border-radius: ${theme.spacing["2"]};
        border: 1px solid ${theme.colors.gray.eb};
        font-weight: ${theme.fontWeight.semibold};
        padding: ${theme.spacing["4"]} 0;
        cursor: pointer;

        ${!onClick &&
        css`
          background: ${theme.colors.gray.eb};
          color: ${theme.colors.gray["700"]};
          cursor: not-allowed;
        `}

        :hover {
          background: ${theme.colors.gray.eb};
        }
      `}
    >
      {children}
    </div>
  );
};

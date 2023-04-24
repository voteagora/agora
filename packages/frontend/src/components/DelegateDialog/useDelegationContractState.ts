import { useFragment, graphql } from "react-relay";
import { ethers } from "ethers";
import { Address } from "@wagmi/core";

import { useDelegationContractStateFragment$key } from "./__generated__/useDelegationContractStateFragment.graphql";
import {
  DelegationContractState,
  PERMISSION_PROPOSE,
  PERMISSION_SIGN,
  PERMISSION_VOTE,
} from "./delegateRules";

export function useDelegationContractState(
  fragmentRef: useDelegationContractStateFragment$key
): DelegationContractState | null {
  const { targetDelegate, currentDelegate } = useFragment(
    graphql`
      fragment useDelegationContractStateFragment on Query
      @argumentDefinitions(
        targetAccountAddress: { type: "String!" }
        currentAccountAddress: { type: "String!" }
        skip: { type: "Boolean!" }
      ) {
        targetDelegate: delegate(addressOrEnsName: $targetAccountAddress) {
          address {
            address
          }

          tokenHoldersRepresented {
            address {
              address
            }
          }
        }

        currentDelegate: delegate(addressOrEnsName: $currentAccountAddress)
          @skip(if: $skip) {
          address {
            address
          }

          delegatingTo {
            address {
              address
            }
          }

          liquidDelegationProxyAddress {
            address
          }

          liquidDelegations {
            to {
              address
            }

            rules {
              permissionVote
              permissionSign
              permissionPropose
              notValidBefore
              notValidAfter
              customRules
              blocksBeforeVoteCloses
              maxRedelegations
            }
          }
        }
      }
    `,
    fragmentRef
  );

  if (!currentDelegate) {
    return null;
  }

  const targetTokenDelegates =
    targetDelegate?.tokenHoldersRepresented?.map((tokenHolders) =>
      tokenHolders.address.address.toLowerCase()
    ) ?? [];

  const currentAccountAddressAddress =
    currentDelegate.address.address.toLowerCase();

  if (targetTokenDelegates.includes(currentAccountAddressAddress)) {
    return {
      type: "TOKEN",
    };
  }

  return {
    type: "LIQUID",
    delegatedToLiquidContract: (() => {
      return (
        currentDelegate.delegatingTo.address.address ===
        currentDelegate.liquidDelegationProxyAddress.address
      );
    })(),
    rules: (() => {
      const delegationTo = currentDelegate.liquidDelegations.find(
        (it) => it.to.address === targetDelegate.address.address
      );

      if (!delegationTo) {
        return null;
      }

      const rules = delegationTo.rules;

      return {
        customRule: (rules.customRules[rules.customRules.length - 1] ??
          ethers.constants.AddressZero) as Address,
        notValidBefore: rules.notValidBefore ? rules.notValidBefore / 1000 : 0,
        notValidAfter: rules.notValidAfter ? rules.notValidAfter / 1000 : 0,
        permissions:
          (rules.permissionPropose ? PERMISSION_PROPOSE : 0) |
          (rules.permissionVote ? PERMISSION_VOTE : 0) |
          (rules.permissionSign ? PERMISSION_SIGN : 0),
        blocksBeforeVoteCloses: rules.blocksBeforeVoteCloses,
        maxRedelegations: rules.maxRedelegations,
      };
    })(),
  };
}

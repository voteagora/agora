import { BigNumber } from "ethers";

import { DropDown } from "../../../DropDown";
import { DelegationContractState } from "../../../delegateRules";
import {
  permissionsString,
  toPermissions,
} from "../../../../VoterPanel/Rows/DelegatedToListRow/PermissionsRule";

export type VotingScopeSettingType = "VOTE_ALL" | "VOTE_PROPHOUSE";

export type WrappedVotingScopeSetting =
  | {
      kind: "CHOOSEN";
      type: VotingScopeSettingType;
    }
  | {
      kind: "EXISTING";
      value: number;
    };

export type Props = {
  value: WrappedVotingScopeSetting;
  onChange: (nextValue: WrappedVotingScopeSetting) => void;
};

export function VotingScopeSelector({ value, onChange }: Props) {
  const items = [
    {
      title: "Delegate can vote on anything",
      subTitle: "They can vote onchain and on Prop House rounds.",
      value: "VOTE_ALL" as const,
    },
    {
      title: "Delegate can vote only on Prop House",
      subTitle: "They can't vote onchain, only on Prop House rounds.",
      value: "VOTE_PROPHOUSE" as const,
    },
  ];

  return (
    <DropDown
      items={items}
      selectedTitle={(() => {
        switch (value.kind) {
          case "CHOOSEN":
            return items.find((it) => it.value === value.type)!.title;

          case "EXISTING":
            return permissionsString(toPermissions(value.value));
        }
      })()}
      value={(() => {
        switch (value.kind) {
          case "CHOOSEN":
            return value.type;

          case "EXISTING":
            return null;
        }
      })()}
      onChange={(type) =>
        onChange({
          kind: "CHOOSEN",
          type,
        })
      }
    />
  );
}

export function existingContractStateIntoVotingScopeSetting(
  existingDelegationContractState: DelegationContractState
): WrappedVotingScopeSetting {
  return ((): WrappedVotingScopeSetting => {
    return (
      (() => {
        if (existingDelegationContractState.type === "TOKEN") {
          return null;
        }

        if (!existingDelegationContractState.delegatedToLiquidContract) {
          return null;
        }

        if (!existingDelegationContractState.rules) {
          return null;
        }

        const rules = toPermissions(
          BigNumber.from(
            existingDelegationContractState.rules.permissions
          ).toNumber()
        );

        if (
          rules.permissionVote &&
          rules.permissionPropose &&
          rules.permissionSign
        ) {
          return {
            kind: "CHOOSEN",
            type: "VOTE_ALL",
          };
        }

        if (rules.permissionSign) {
          return {
            kind: "CHOOSEN",
            type: "VOTE_PROPHOUSE",
          };
        }

        return null;
      })() ?? {
        kind: "CHOOSEN",
        type: "VOTE_ALL",
      }
    );
  })();
}

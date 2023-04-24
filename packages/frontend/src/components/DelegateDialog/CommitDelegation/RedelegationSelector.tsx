import { BigNumber } from "ethers";

import { DropDown } from "../DropDown";
import { DelegationContractState } from "../delegateRules";

export type RedelegationSettingType =
  | "NOT_ALLOWED"
  | "ALLOWED_ONCE"
  | "ALLOWED_ALL";

export type WrappedRedelegationSetting =
  | {
      kind: "CHOOSEN";
      type: RedelegationSettingType;
    }
  | {
      kind: "EXISTING";
      value: number;
    };

export type Props = {
  value: WrappedRedelegationSetting;
  onChange: (nextValue: WrappedRedelegationSetting) => void;
};

export function RedelegationSelector({ value, onChange }: Props) {
  const items = [
    {
      title: "Redelegation not allowed",
      subTitle: "Your delegate cannot delegate to anyone else.",
      value: "NOT_ALLOWED" as const,
    },
    {
      title: "Redelegation allowed once",
      subTitle:
        "Your delegate can delegate your tokens to another person or contract.",
      value: "ALLOWED_ONCE" as const,
    },
    {
      title: "Redelegation allowed",
      subTitle: "Any address your delegate delegates to can also delegate.",
      value: "ALLOWED_ALL" as const,
    },
  ];

  return (
    <DropDown
      items={items}
      value={(() => {
        switch (value.kind) {
          case "CHOOSEN":
            return value.type;

          case "EXISTING":
            return null;
        }
      })()}
      selectedTitle={(() => {
        switch (value.kind) {
          case "CHOOSEN":
            return items.find((it) => it.value === value.type)!.title;

          case "EXISTING":
            return `Redelegation allowed ${value.value} times`;
        }
      })()}
      onChange={(type) => onChange({ kind: "CHOOSEN", type })}
    />
  );
}

export function existingContractStateIntoRedelegationSetting(
  existingDelegationContractState: DelegationContractState
): WrappedRedelegationSetting {
  return ((): WrappedRedelegationSetting => {
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

        const value = BigNumber.from(
          existingDelegationContractState.rules.maxRedelegations
        );

        if (value.eq(1)) {
          return {
            kind: "CHOOSEN",
            type: "ALLOWED_ONCE",
          };
        }

        if (value.eq(0)) {
          return {
            kind: "CHOOSEN",
            type: "NOT_ALLOWED",
          };
        }

        if (value.eq(0xff)) {
          return {
            kind: "CHOOSEN",
            type: "ALLOWED_ALL",
          };
        }

        return {
          kind: "EXISTING",
          value: value.toNumber(),
        };
      })() ?? { kind: "CHOOSEN", type: "NOT_ALLOWED" }
    );
  })();
}

import { DelegationContractState } from "../delegateRules";
import { DropDown } from "../DropDown";
import { formatDate } from "../../../words";
import { BigNumber } from "ethers";

export type TimePeriodSettingType =
  | "INFINITE"
  | "TIME_PERIOD_1_MONTH"
  | "TIME_PERIOD_2_MONTH"
  | "TIME_PERIOD_6_MONTH"
  | "TIME_PERIOD_12_MONTH";

export type WrappedTimePeriodSetting =
  | {
      kind: "CHOOSEN";
      type: TimePeriodSettingType;
    }
  | {
      kind: "EXISTING";
      value: Date;
    };

export type Props = {
  value: WrappedTimePeriodSetting;
  onChange: (nextValue: WrappedTimePeriodSetting) => void;
};

export function TimePeriodSelector({ value, onChange }: Props) {
  const items = [
    {
      title: "Delegate until revoked",
      subTitle: "Your delegate can vote until you revoke your tokens.",
      value: "INFINITE" as const,
    },
    {
      title: "Delegate temporarily (1 month)",
      subTitle: "Your delegate can vote for 1 month.",
      value: "TIME_PERIOD_1_MONTH" as const,
    },
    {
      title: "Delegate temporarily (2 months)",
      subTitle: "Your delegate can vote for 2 months.",
      value: "TIME_PERIOD_2_MONTH" as const,
    },
    {
      title: "Delegate temporarily (6 months)",
      subTitle: "Your delegate can vote for 6 months.",
      value: "TIME_PERIOD_6_MONTH" as const,
    },
    {
      title: "Delegate temporarily (12 months)",
      subTitle: "Your delegate can vote for 12 months.",
      value: "TIME_PERIOD_12_MONTH" as const,
    },
  ];

  return (
    <DropDown
      items={items}
      selectedTitle={(() => {
        switch (value.kind) {
          case "EXISTING":
            return `Delegate till ${formatDate(value.value)}`;

          case "CHOOSEN":
            return items.find((it) => it.value === value.type)!.title;
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
      onChange={(type) => onChange({ kind: "CHOOSEN", type })}
    />
  );
}

export function existingContractStateIntoTimePeriodSetting(
  existingDelegationContractState: DelegationContractState
): WrappedTimePeriodSetting {
  return ((): WrappedTimePeriodSetting => {
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
          existingDelegationContractState.rules.notValidAfter
        );

        if (value.eq(0)) {
          return {
            kind: "CHOOSEN",
            type: "INFINITE",
          };
        }

        return {
          kind: "EXISTING",
          value: new Date(value.mul(1000).toNumber()),
        };
      })() ?? { kind: "CHOOSEN", type: "INFINITE" }
    );
  })();
}

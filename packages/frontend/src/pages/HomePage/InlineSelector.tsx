import { dropdownContainerStyles } from "../EditDelegatePage/TopIssuesFormSection";
import { HStack } from "../../components/VStack";
import * as theme from "../../theme";
import { RadioGroup } from "@headlessui/react";
import { css } from "@emotion/css";
import { ReactNode, useEffect, useState } from "react";

export type InlineSelectorItem<T> = {
  icon: ReactNode;
  title: string;
  value: T;
};

export enum InlineSelectorRadius {
  Left = "left",
  Right = "right",
  Full = "full",
}

type InlineSelectorProps<T> = {
  items: InlineSelectorItem<T>[];
  onChange: (item: string) => void;
  selectorRadius?: InlineSelectorRadius;
  initValue?: string;
};

export function InlineSelector<T>({
  items,
  onChange,
  selectorRadius = InlineSelectorRadius.Full,
  initValue = "",
}: InlineSelectorProps<T>) {
  let [borderRadius, setBorderRadius] = useState<string>(
    `${theme.borderRadius.full}`
  );
  let [selected, setSelected] = useState<string>(initValue);
  useEffect(() => {
    switch (selectorRadius) {
      case InlineSelectorRadius.Left:
        setBorderRadius(
          `${theme.borderRadius.full} 0px 0px ${theme.borderRadius.full}`
        );
        break;
      case InlineSelectorRadius.Right:
        setBorderRadius(
          `0px ${theme.borderRadius.full} ${theme.borderRadius.full} 0px`
        );
        break;
      case InlineSelectorRadius.Full:
        setBorderRadius(`${theme.borderRadius.full}`);
        break;
    }
  }, [selectorRadius]);

  return (
    <RadioGroup
      value={selected}
      onChange={(item) => {
        setSelected(item);
        onChange(item);
      }}
      as="div"
      className={dropdownContainerStyles}
    >
      <HStack
        alignItems="center"
        gap="1"
        className={css`
          background: #f7f7f7;
          border-radius: ${borderRadius};
          border: 1px solid ${theme.colors.gray.eb};
          padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-evenly;
          height: 100%;
          @media (max-width: ${theme.maxWidth.lg}) {
            border-radius: ${theme.borderRadius.full};
          }
        `}
      >
        {items.map(({ icon, title, value }, index) => (
          <RadioGroup.Option key={index} value={value}>
            {() => (
              <div
                className={css`
                  white-space: nowrap;
                  border: 1px solid transparent;
                  cursor: pointer;
                  ${selected !== value &&
                  css`
                    color: #66676b;
                  `}
                  ${selected === value &&
                  css`
                    color: #000000;
                  `}
                `}
              >
                {icon}
              </div>
            )}
          </RadioGroup.Option>
        ))}
      </HStack>
    </RadioGroup>
  );
}

import {
  dropdownContainerStyles,
  dropdownItemActiveStyle,
  DropdownItems,
  dropdownItemStyle,
} from "../EditDelegatePage/TopIssuesFormSection";
import { HStack } from "../../components/VStack";
import * as theme from "../../theme";
import { Listbox } from "@headlessui/react";
import { css } from "@emotion/css";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";

export type SelectorItem<T> = {
  title: string;
  value: T;
};

export enum SelectorRadius {
  Left = "left",
  Right = "right",
  Full = "full",
}

type SelectorProps<T> = {
  items: SelectorItem<T>[];
  value: T;
  onChange: (item: T) => void;
  selectorRadius?: SelectorRadius;
};

export function Selector<T>({
  items,
  value,
  onChange,
  selectorRadius = SelectorRadius.Full,
}: SelectorProps<T>) {
  let [borderRadius, setBorderRadius] = useState<string>(
    `${theme.borderRadius.full}`
  );
  useEffect(() => {
    switch (selectorRadius) {
      case SelectorRadius.Left:
        setBorderRadius(
          `${theme.borderRadius.full} 0px 0px ${theme.borderRadius.full}`
        );
        break;
      case SelectorRadius.Right:
        setBorderRadius(
          `0px ${theme.borderRadius.full} ${theme.borderRadius.full} 0px`
        );
        break;
      case SelectorRadius.Full:
        setBorderRadius(`${theme.borderRadius.full}`);
        break;
    }
  }, [selectorRadius]);

  return (
    <Listbox
      value={value}
      onChange={(item) => onChange(item)}
      as="div"
      className={dropdownContainerStyles}
    >
      {({ open }) => (
        <>
          <Listbox.Button
            className={css`
              justify-content: center;
            `}
          >
            <HStack
              alignItems="center"
              gap="2"
              className={css`
                background: #f7f7f7;
                border-radius: ${borderRadius};
                border: 1px solid ${theme.colors.gray.eb};
                padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
                @media (max-width: ${theme.maxWidth.lg}) {
                  border-radius: ${theme.borderRadius.full};
                }
              `}
            >
              <div>{items.find((item) => item.value === value)?.title}</div>

              <ChevronDownIcon
                aria-hidden="true"
                className={css`
                  width: ${theme.spacing["4"]};
                  height: ${theme.spacing["4"]};
                `}
              />
            </HStack>
          </Listbox.Button>
          <Listbox.Options static>
            <DropdownItems open={open}>
              {items.map(({ title, value }, index) => (
                <Listbox.Option key={index} value={value}>
                  {({ selected, active }) => (
                    <div
                      className={css`
                        ${dropdownItemStyle}
                        ${selected && dropdownItemActiveStyle}
                        ${!selected &&
                        active &&
                        css`
                          background: ${theme.colors.gray.eb};
                        `}
                      `}
                    >
                      {title}
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </DropdownItems>
          </Listbox.Options>
        </>
      )}
    </Listbox>
  );
}

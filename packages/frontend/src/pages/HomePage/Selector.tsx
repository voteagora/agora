import { Listbox } from "@headlessui/react";
import { css, cx } from "@emotion/css";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

import * as theme from "../../theme";
import { HStack } from "../../components/VStack";
import {
  dropdownContainerStyles,
  dropdownItemActiveStyle,
  DropdownItems,
  dropdownItemStyle,
} from "../../components/DelegateDialog/DropDown";

export type SelectorItem<T> = {
  title: string;
  value: T;
};

export type SelectorProps<T> = {
  items: SelectorItem<T>[];
  value: T;
  onChange: (item: T) => void;
  size: "m" | "l";
};

export function Selector<T>({
  items,
  value,
  onChange,
  size,
}: SelectorProps<T>) {
  const sizeM = css`
    background: #f7f7f7;
    gap: 0;
    font-size: ${theme.fontSize.xs};
    white-space: nowrap;
    font-weight: ${theme.fontWeight.medium};
    border-radius: ${theme.borderRadius.full};
    padding: ${theme.spacing["1"]} ${theme.spacing["2"]} ${theme.spacing["1"]}
      ${theme.spacing["3"]};
  `;

  const sizeL = css`
    background: #f7f7f7;
    border-radius: ${theme.borderRadius.full};
    white-space: nowrap;
    padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
  `;

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
              gap="1"
              className={cx(
                { [sizeM]: size === "m" },
                { [sizeL]: size === "l" }
              )}
            >
              <div>{items.find((item) => item.value === value)?.title}</div>

              <ChevronDownIcon
                aria-hidden="true"
                className={css`
                  opacity: 30%;
                  transition: 200ms all;
                  width: ${theme.spacing["4"]};
                  height: ${theme.spacing["4"]};
                  :hover {
                    opacity: 100%;
                  }
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
                          transition: 200ms all;
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

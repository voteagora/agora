import {
  dropdownContainerStyles,
  dropdownItemActiveStyle,
  DropdownItems,
  dropdownItemStyle,
} from "../EditDelegatePage/TopIssuesFormSection";
import { HStack } from "../../components/VStack";
import * as theme from "../../theme";
import { Listbox } from "@headlessui/react";
import { css, cx } from "@emotion/css";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

export type SelectorItem<T> = {
  title: string;
  value: T;
};

type SelectorProps<T> = {
  borderType?: string;
  items: SelectorItem<T>[];
  value: T;
  onChange: (item: T) => void;
};

export function Selector<T>({
  borderType,
  items,
  value,
  onChange,
}: SelectorProps<T>) {
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
              className={cx(
                css`
                  background: #f7f7f7;
                  border-radius: ${theme.borderRadius.full};
                  border: 1px solid ${theme.colors.gray.eb};
                  padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
                `,
                borderType === "rightOnly"
                  ? css`
                      border-radius: 0 35px 35px 0;
                    `
                  : ""
              )}
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

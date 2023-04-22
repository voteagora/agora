import { HStack, VStack } from "../VStack";
import * as theme from "../../theme";
import { Listbox } from "@headlessui/react";
import { css } from "@emotion/css";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

export const dropdownContainerStyles = css`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;
`;

export const dropdownItemStyle = css`
  white-space: nowrap;
  border-radius: ${theme.spacing["3"]};
  border: 1px solid transparent;
  padding: ${theme.spacing["2"]} ${theme.spacing["3"]};
  cursor: pointer;
  color: #66676b;
`;

export const dropdownItemActiveStyle = css`
  background: white;
  color: black;
  border-color: ${theme.colors.gray.eb};
`;

export type DropDownItem<T> = {
  title: string;
  subTitle?: string;
  inputField?: string;
  value: T;
};
type DropDownProps<T> = {
  items: DropDownItem<T>[];
  value: T | null;
  onChange: (item: T) => void;
  selectedTitle: string;
};

export function DropDown<T>({
  items,
  value,
  onChange,
  selectedTitle,
}: DropDownProps<T>) {
  return (
    <Listbox
      value={value}
      onChange={(item) => item && onChange(item)}
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
            <HStack alignItems="center" justifyContent="space-between" gap="1">
              <div>{selectedTitle}</div>

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
            <DropdownItems open={open} fullWidth>
              {items.map(({ title, subTitle, value }, index) => (
                <Listbox.Option key={index} value={value}>
                  {({ selected, active }) => (
                    <div
                      className={css`
                        padding: ${theme.spacing["2"]} ${theme.spacing["2"]};
                        border: 1px solid transparent;
                        border-radius: ${theme.borderRadius["lg"]};
                        cursor: pointer;
                        ${selected && dropdownItemActiveStyle}
                        ${!selected &&
                        active &&
                        css`
                          transition: 200ms all;
                          background: ${theme.colors.gray.eb};
                        `}
                      `}
                    >
                      <div>{title}</div>
                      <div
                        className={css`
                          color: ${theme.colors.gray["700"]};
                          font-size: ${theme.fontSize["sm"]};
                        `}
                      >
                        {subTitle}
                      </div>
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

type DropdownItemsProps = {
  open: boolean;
  children: ReactNode;
  fullWidth?: boolean;
};

export function DropdownItems({
  open,
  children,
  fullWidth,
}: DropdownItemsProps) {
  return (
    <div
      className={css`
        position: absolute;
        z-index: 3;
        outline: none;

        top: calc(100% + ${theme.spacing["2"]});
        right: 0;
        ${fullWidth &&
        css`
          width: 100%;
        `}
      `}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            style={{ originY: "-100%", originX: "100%" }}
            initial={{ opacity: 0, scale: 0.9 }}
            exit={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            <VStack
              gap="1"
              className={css`
                background: #f7f7f7;
                box-shadow: ${theme.boxShadow.newDefault};
                border: 1px solid ${theme.colors.gray.eb};
                padding: ${theme.spacing["2"]};
                border-radius: ${theme.spacing["4"]};
              `}
            >
              {children}
            </VStack>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

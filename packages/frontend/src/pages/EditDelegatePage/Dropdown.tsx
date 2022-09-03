import { css } from "@emotion/css";
import * as theme from "../../theme";

type DropdownItemValue = {
  selectKey: string;
  title: string;
};

type Props = {
  items: DropdownItemValue[];
  title: string;
  onItemClicked: (selectKey: string) => void;
};

export function Dropdown({ title, items, onItemClicked }: Props) {
  return (
    <span
      className={css`
        font-size: ${theme.fontSize.xs};
        color: ${theme.colors.gray["600"]};

        cursor: pointer;
        position: relative;

        > div {
          display: none;
        }

        :hover > div {
          display: block;
        }
      `}
    >
      {title}
      <div
        className={css`
          position: absolute;
          top: 100%;
          right: 0;

          white-space: nowrap;
          background: ${theme.colors.gray["300"]};
          z-index: 1;
        `}
      >
        {items.map((item) => (
          <DropdownItem
            key={item.selectKey}
            selectKey={item.selectKey}
            title={item.title}
            onClick={() => onItemClicked(item.selectKey)}
          />
        ))}
      </div>
    </span>
  );
}

type DropdownItemProps = {
  selectKey: string;
  title: string;
  onClick: () => void;
};

function DropdownItem({ title, onClick }: DropdownItemProps) {
  return (
    <div
      onClick={onClick}
      className={css`
        padding: ${theme.spacing["1"]} ${theme.spacing["2"]};

        :hover {
          background: ${theme.colors.gray["200"]};
        }
      `}
    >
      {title}
    </div>
  );
}

import { icons } from "../../icons/icons";
import * as theme from "../../theme";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import { css } from "@emotion/css";

export function RetroPGFIconListItem({
  text,
  href,
  icon,
}: {
  text: string;
  href: string;
  icon: keyof typeof icons;
}) {
  return (
    <li
      className={css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding-top: 16px;
      `}
    >
      <a
        className={css`
          display: flex;
          align-items: center;
          gap: 8px;
        `}
        href={href}
      >
        <div>
          <img src={icons[icon]} alt={icon} />
        </div>
        <div
          className={css`
            font-family: "Inter";
            font-style: normal;
            font-weight: 500;
            font-size: 16px;
            line-height: 24px;
            color: #000000;
          `}
        >
          {text}
        </div>
      </a>
      <a
        className={css`
          display: flex;
          align-items: center;
          gap: 8px;
        `}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        <ArrowTopRightOnSquareIcon
          className={css`
            width: 20px;
            height: 20px;
            color: ${theme.colors.gray["500"]};
            diplsy: inline;
          `}
        />
      </a>
    </li>
  );
}

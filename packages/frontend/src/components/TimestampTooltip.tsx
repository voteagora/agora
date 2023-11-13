import { css } from "@emotion/css";
import { format } from "date-fns";
import { Tooltip } from "react-tooltip";

import * as theme from "../theme";

export default function TimestampTooltip({
  children,
  date,
}: {
  children: React.ReactNode;
  date: string | number | Date;
}) {
  return (
    <>
      <div
        className={css`
          cursor: help;
        `}
        data-tooltip-id={date.toString()}
      >
        <Tooltip id={date.toString()}>
          <div
            className={css`
              font-size: 12px;
              line-height: 16px;
              font-weight: ${theme.fontWeight.normal};
              color: ${theme.colors.gray[200]};
            `}
          >
            {format(new Date(date), "EEE, d LLL yyyy HH:mm:ss")}
          </div>
        </Tooltip>
        {children}
      </div>
    </>
  );
}

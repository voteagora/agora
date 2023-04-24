import { ReactNode } from "react";
import { css } from "@emotion/css";

import { HStack } from "../../VStack";
import * as theme from "../../../theme";

export type PanelRowProps = {
  title: string;
  detail: ReactNode;
};

export const PanelRow = ({ title, detail }: PanelRowProps) => {
  return (
    <HStack gap="2" justifyContent="space-between" alignItems="baseline">
      <span
        className={css`
          white-space: nowrap;
        `}
      >
        {title}
      </span>

      <span
        className={css`
          font-size: ${theme.fontSize.sm};
          color: #4f4f4f;
          text-align: right;
        `}
      >
        {detail}
      </span>
    </HStack>
  );
};

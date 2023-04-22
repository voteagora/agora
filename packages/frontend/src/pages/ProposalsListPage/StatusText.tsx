import { css, cx } from "@emotion/css";
import { ReactNode } from "react";

import * as theme from "../../theme";

export function StatusText({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <div
      className={cx(
        css`
          font-size: ${theme.fontSize["sm"]};
          font-weight: ${theme.fontWeight["medium"]};
        `,
        className
      )}
    >
      {children}
    </div>
  );
}

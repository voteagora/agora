import { ReactNode } from "react";
import { cx } from "@emotion/css";

export function StatusText({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return <div className={cx(className)}>{children}</div>;
}

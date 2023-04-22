import { css, cx } from "@emotion/css";
import { ReactNode } from "react";
import * as theme from "../theme";
import { DataType } from "csstype";

type Props = {
  className?: string;
  gap?: keyof typeof theme["spacing"];
  justifyContent?: DataType.ContentDistribution | DataType.ContentPosition;
  alignItems?: DataType.SelfPosition | "baseline" | "normal" | "stretch";
  children: ReactNode;
};

function Stack({
  className,
  gap,
  alignItems,
  justifyContent,
  children,
}: Props) {
  return (
    <div
      className={cx(
        css`
          display: flex;
          gap: ${gap && theme.spacing[gap]};
          justify-content: ${justifyContent};
          align-items: ${alignItems};
        `,
        className
      )}
    >
      {children}
    </div>
  );
}

export function VStack(props: Props) {
  return (
    <Stack
      {...props}
      className={cx(
        css`
          flex-direction: column;
        `,
        props.className
      )}
    />
  );
}

export function HStack(props: Props) {
  return (
    <Stack
      className={cx(
        css`
          flex-direction: row;
        `,
        props.className
      )}
      {...props}
    />
  );
}

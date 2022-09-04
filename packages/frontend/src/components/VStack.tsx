import { css, cx } from "@emotion/css";
import { ReactNode } from "react";
import * as theme from "../theme";
import { DataType } from "csstype";

type Props = {
  className?: string;
  gap?: keyof typeof theme["spacing"];
  justifyContent?: DataType.ContentDistribution | DataType.ContentPosition;
  children: ReactNode;
};

function Stack({ className, gap, justifyContent, children }: Props) {
  return (
    <div
      className={cx(
        css`
          display: flex;
          gap: ${gap && theme.spacing[gap]};
          justify-content: ${justifyContent};
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
      className={cx(
        css`
          flex-direction: column;
        `,
        props.className
      )}
      {...props}
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

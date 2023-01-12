import React, { ReactNode } from "react";
import { css } from "@emotion/css";
import * as theme from "../theme";
import { VStack } from "./VStack";
import { RouteTransitionLoadingIndicator } from "./RouteTransitionLoadingIndicator";
import { inset0 } from "../theme";

type Props = {
  children: ReactNode;
};

export function PageContainer({ children }: Props) {
  return (
    <VStack
      alignItems="center"
      className={css`
        font-family: ${theme.fontFamily.sans};
      `}
    >
      <RouteTransitionLoadingIndicator />
      {/* <DottedBackground /> */}

      <div
        className={css`
          position: fixed;

          top: 0;
          height: 100%;
          width: 100%;
          background: radial-gradient(
            circle,
            rgba(252, 252, 252, 0) 60%,
            rgba(252, 252, 252, 1) 100%
          );

          z-index: -9;
          pointer-events: none;
        `}
      />

      {children}
    </VStack>
  );
}

function DottedBackground() {
  return (
    <div
      className={css`
        position: absolute;
        ${inset0};

        z-index: -10;

        background-color: #fcfcfc;
        background-image: radial-gradient(
          rgba(0, 0, 0, 10%) 0.5px,
          transparent 0
        );
        background-size: 8px 8px;
      `}
    />
  );
}

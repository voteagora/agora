import { ReactNode, useMemo } from "react";
import { css } from "@emotion/css";
import { BigNumber, utils } from "ethers";

import { VStack } from "../../components/VStack";
import * as theme from "../../theme";
import { shadow } from "../../theme";

type VoteDetailsContainerProps = {
  children: ReactNode;
};

export function VoteDetailsContainer({ children }: VoteDetailsContainerProps) {
  return (
    <VStack
      gap="3"
      className={css`
        border-radius: ${theme.borderRadius.lg};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray.eb};
        background: ${theme.colors.white};
        box-shadow: ${shadow};
        max-height: 15rem;
      `}
    >
      {children}
    </VStack>
  );
}

export type VoteTitleProps = {
  children: ReactNode;
};

export function VoteTitle({ children }: VoteTitleProps) {
  return (
    <h2
      className={css`
        font-size: ${theme.fontSize.base};
        padding: ${theme.spacing[1]} 0;
        overflow: hidden;
        text-overflow: ellipsis;
      `}
    >
      {children}
    </h2>
  );
}

export type ValuePartProps = {
  ethValue: string;
  usdcValue: string;
};

export function ValuePart({ ethValue, usdcValue }: ValuePartProps) {
  const ethAmount = useMemo(() => BigNumber.from(ethValue), [ethValue]);
  const usdcAmount = useMemo(() => BigNumber.from(usdcValue), [usdcValue]);

  return (
    <>
      {!usdcAmount.isZero() && !ethAmount.isZero() ? (
        <>
          {" "}
          requesting{" "}
          {parseFloat(utils.formatUnits(usdcAmount, 6)).toLocaleString(
            "en-US"
          )}{" "}
          USDC + {parseFloat(utils.formatEther(ethAmount)).toFixed(1)} ETH
        </>
      ) : !usdcAmount.isZero() ? (
        <>
          {" "}
          requesting{" "}
          {parseFloat(utils.formatUnits(usdcAmount, 6)).toLocaleString(
            "en-US"
          )}{" "}
          USDC{" "}
        </>
      ) : !ethAmount.isZero() ? (
        <>
          {" "}
          requesting {parseFloat(utils.formatEther(ethAmount)).toFixed(
            1
          )} ETH{" "}
        </>
      ) : (
        ""
      )}
    </>
  );
}

export type SupportTextProps = {
  supportType: "FOR" | "AGAINST" | "ABSTAIN";
};

export function colorForSupportType(
  supportType: SupportTextProps["supportType"]
) {
  switch (supportType) {
    case "AGAINST":
      return theme.colors.red["600"];

    case "ABSTAIN":
      return theme.colors.gray["700"];

    case "FOR":
      return theme.colors.green["600"];
  }
}

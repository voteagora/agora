import * as theme from "../../theme";
import { ReactNode, useMemo } from "react";
import { VStack } from "../../components/VStack";
import { css } from "@emotion/css";
import { BigNumber, utils } from "ethers";
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
  value: string;
};

export function ValuePart({ value }: ValuePartProps) {
  const amount = useMemo(() => BigNumber.from(value), [value]);

  return (
    <>
      {!amount.isZero() ? <> asking {utils.formatEther(amount)} ETH</> : null}{" "}
    </>
  );
}

export type SupportTextProps = {
  supportType: "FOR" | "AGAINST" | "ABSTAIN";
};

export function toSupportType(
  value: number,
  hasAgainst: boolean
): "FOR" | "AGAINST" | "ABSTAIN" {
  // Approval proposal: for=0, Abstain=1
  // Standard proposal: against=0, for=1, Abstain=2
  switch (value) {
    case 0:
      if (hasAgainst) {
        return "AGAINST";
      } else {
        return "FOR";
      }
    case 1:
      if (hasAgainst) {
        return "FOR";
      } else {
        return "ABSTAIN";
      }
    case 2:
      return "ABSTAIN";
    default:
      throw new Error(`unknown type ${value}`);
  }
}

export function colorForSupportType(
  supportType: SupportTextProps["supportType"]
) {
  switch (supportType) {
    case "AGAINST":
      return theme.colors.red["700"];

    case "ABSTAIN":
      return theme.colors.gray["700"];

    case "FOR":
      return theme.colors.green["700"];
  }
}

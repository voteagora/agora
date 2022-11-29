import * as theme from "../../theme";
import { ReactNode, useMemo } from "react";
import { shadow } from "./VoterPanel";
import { VStack } from "../../components/VStack";
import { css } from "@emotion/css";
import { BigNumber, utils } from "ethers";

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

export function toSupportType(value: number): "FOR" | "AGAINST" | "ABSTAIN" {
  switch (value) {
    case 0:
      return "AGAINST";
    case 1:
      return "FOR";
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
      return theme.colors.red["600"];

    case "ABSTAIN":
      return theme.colors.gray["700"];

    case "FOR":
      return theme.colors.green["600"];
  }
}

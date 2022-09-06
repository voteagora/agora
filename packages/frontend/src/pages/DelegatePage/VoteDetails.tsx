import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { BigNumber, utils } from "ethers";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoteDetailsFragment$key } from "./__generated__/VoteDetailsFragment.graphql";
import { VStack } from "../../components/VStack";
import { shadow } from "./VoterPanel";
import { useMemo } from "react";

type Props = {
  voteFragment: VoteDetailsFragment$key;
};

export function VoteDetails({ voteFragment }: Props) {
  const vote = useFragment(
    graphql`
      fragment VoteDetailsFragment on Vote {
        id
        reason
        supportDetailed
        votes

        proposal {
          id
          title

          totalValue
        }
      }
    `,
    voteFragment
  );

  const proposalHref = `https://nouns.wtf/vote/${vote.proposal.id}`;

  return (
    <VStack
      className={css`
        border-radius: ${theme.borderRadius.lg};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray.eb};
        background: ${theme.colors.white};
        box-shadow: ${shadow};

        padding: ${theme.spacing["6"]};
      `}
    >
      <div
        className={css`
          font-size: ${theme.fontSize.xs};
          color: ${theme.colors.gray["700"]};
        `}
      >
        <SupportText supportType={vote.supportDetailed} /> &mdash;{" "}
        <a href={proposalHref}>Prop {vote.proposal.id}</a>
        <ValuePart value={vote.proposal.totalValue} />
        &mdash; with {vote.votes} votes
      </div>
      <h2
        className={css`
          font-size: ${theme.fontSize.base};
        `}
      >
        <a href={proposalHref}>{vote.proposal.title}</a>
      </h2>
      <p>{vote.reason}</p>
    </VStack>
  );
}

type ValuePartProps = {
  value: string;
};

export function ValuePart({ value }: ValuePartProps) {
  const amount = useMemo(() => BigNumber.from(value), [value]);

  return (
    <>{!amount.isZero() ? <> for {utils.formatEther(amount)} ETH</> : null} </>
  );
}

type SupportTextProps = {
  supportType: number;
};

function SupportText({ supportType }: SupportTextProps) {
  switch (supportType) {
    case 0:
      return (
        <span
          className={css`
            color: ${theme.colors.red["700"]};
          `}
        >
          AGAINST
        </span>
      );

    case 1:
      return (
        <span
          className={css`
            color: ${theme.colors.green["700"]};
          `}
        >
          FOR
        </span>
      );

    case 2:
      return (
        <span
          className={css`
            color: ${theme.colors.gray["700"]};
          `}
        >
          ABSTAIN
        </span>
      );

    default:
      throw new Error(`unknown type ${supportType}`);
  }
}

import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { BigNumber, utils } from "ethers";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoteDetailsFragment$key } from "./__generated__/VoteDetailsFragment.graphql";
import { VStack } from "../../components/VStack";
import { shadow } from "./VoterPanel";
import { useMemo, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion, useScroll, useTransform } from "framer-motion";
import { pluralizeVote } from "../../words";

type Props = {
  voteFragment: VoteDetailsFragment$key;
};

export function VoteDetails({ voteFragment }: Props) {
  const vote = useFragment(
    graphql`
      fragment VoteDetailsFragment on Vote {
        reason
        supportDetailed
        votes
        createdAt

        proposal {
          number
          title

          totalValue
        }
      }
    `,
    voteFragment
  );
  const proposalHref = `https://nouns.wtf/vote/${vote.proposal.number}`;

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = useScroll({ container: scrollContainerRef });

  const footOpacity = useTransform(scroll.scrollY, (value) => {
    return 1 - value / 32;
  });

  return (
    <VStack
      gap="3"
      className={css`
        position: relative;
        border-radius: ${theme.borderRadius.lg};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray.eb};
        background: ${theme.colors.white};
        box-shadow: ${shadow};
        flex: 1;
        max-height: 15rem;
        overflow: hidden;
      `}
    >
      <motion.div
        style={{ opacity: footOpacity }}
        className={css`
          position: absolute;
          height: ${theme.spacing["4"]};
          background: linear-gradient(rgba(255, 255, 255, 0), #fff);
          bottom: 0;
          left: 0;
          right: 0;
        `}
      />

      <div
        ref={scrollContainerRef}
        className={css`
          display: flex;
          flex-direction: column;
          gap: ${theme.spacing["2"]};
          padding-top: ${theme.spacing["5"]};
          padding-left: ${theme.spacing["5"]};
          padding-right: ${theme.spacing["5"]};
          padding-bottom: ${theme.spacing["5"]};
          overflow-y: scroll;
        `}
      >
        <VStack>
          <div
            className={css`
              font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.medium};
              color: #66676b;
            `}
          >
            <SupportText supportType={vote.supportDetailed} /> &mdash;{" "}
            <a href={proposalHref}>Prop {vote.proposal.number}</a>
            <ValuePart value={vote.proposal.totalValue} />
            with {pluralizeVote(BigNumber.from(vote.votes))}
          </div>
          <div
            className={css`
              font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.medium};
              color: #66676b;
            `}
          ></div>

          <h2
            className={css`
              font-size: ${theme.fontSize.base};
              padding: ${theme.spacing[1]} 0;
              overflow: hidden;
              text-overflow: ellipsis;
            `}
          >
            <a href={proposalHref}>{vote.proposal.title}</a>
          </h2>
          {vote.createdAt && (
            <div
              className={css`
                font-size: ${theme.fontSize.xs};
                font-weight: ${theme.fontWeight.medium};
                color: #66676b;
              `}
            >
              {formatDistanceToNow(new Date(Number(vote.createdAt) * 1000))} ago
            </div>
          )}
        </VStack>

        <span
          className={css`
            color: #66676b;
            line-height: ${theme.lineHeight.snug};
          `}
        >
          {vote.reason}
        </span>
      </div>
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

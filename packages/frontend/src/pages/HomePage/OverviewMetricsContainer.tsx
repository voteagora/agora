import { css } from "@emotion/css";
import { ReactNode } from "react";
import * as theme from "../../theme";
import { icons } from "../../icons/icons";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { OverviewMetricsContainer$key } from "./__generated__/OverviewMetricsContainer.graphql";
import { BigNumber } from "ethers";
import { HStack, VStack } from "../../components/VStack";

type Props = {
  fragmentRef: OverviewMetricsContainer$key;
};

export function OverviewMetricsContainer({ fragmentRef }: Props) {
  const { delegates, metrics } = useFragment(
    graphql`
      fragment OverviewMetricsContainer on Query {
        delegates(
          first: 1000
          where: { tokenHoldersRepresentedAmount_gt: 0 }
          orderBy: tokenHoldersRepresentedAmount
          orderDirection: desc
        ) {
          id
        }

        metrics {
          totalSupply
          quorumVotes
          quorumVotesBPS
          proposalThreshold
        }
      }
    `,
    fragmentRef
  );

  const nounsCount = BigNumber.from(metrics.totalSupply);
  const quorumCount = BigNumber.from(metrics.quorumVotes);
  const quorumBps = BigNumber.from(metrics.quorumVotesBPS);
  const proposalThreshold = BigNumber.from(metrics.proposalThreshold);

  const votersCount = delegates.length;

  // todo: real values
  return (
    <HStack
      justifyContent="space-between"
      gap="4"
      className={css`
        z-index: 1;
        width:100%;
        max-width: ${theme.maxWidth["6xl"]};
        flex-wrap: wrap;
      `}
    >
      {/*todo: review this metric*/}
      <MetricContainer
        icon="community"
        title="Voters / Nouns"
        body={`${votersCount} / ${nounsCount} (${(
          (1 - votersCount / nounsCount.toNumber()) *
          100
        ).toFixed(0)}% delegation)`}
      />

      <MetricContainer
        icon="ballot"
        title="Quorum"
        body={`${quorumCount.toNumber()} nouns (${quorumBps
          .div(100)
          .toNumber()
          .toFixed(0)}% of supply)`}
      />

      <MetricContainer
        icon="measure"
        title="Proposal threshold"
        body={`${proposalThreshold} noun`}
      />

      {/*todo: review this metric*/}
      <MetricContainer icon="pedestrian" title="Avg voter turnout" body="54%" />
    </HStack>
  );
}

type MetricContainerProps = {
  icon: keyof typeof icons;
  title: string;
  body: ReactNode;
};

const color = "#FBFBFB";

function MetricContainer({ icon, title, body }: MetricContainerProps) {
  return (
    <HStack
      gap="3"
      className={css`
        background: ${theme.colors.white};
        border-radius: ${theme.spacing["3"]};
        padding: ${theme.spacing["3"]};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray["300"]};
        box-shadow: ${theme.boxShadow.newDefault};
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: ${theme.spacing["2"]};
          border-width: ${theme.spacing.px};
          border-color: ${theme.colors.gray["300"]};
          background: ${color};
          flex-shrink: 0;
          padding: ${theme.spacing["3"]};
        `}
      >
        <img
          className={css`
            width: 24px;
            height: 24px;
          `}
          src={icons[icon]}
          alt={icon}
        />
      </div>

      <VStack
        className={css`
          padding-right: ${theme.spacing["1"]};
        `}
      >
        <div
          className={css`
            font-size: ${theme.fontSize.sm};
            color: ${theme.colors.gray["700"]};
            white-space: nowrap;
            text-overflow: ellipsis;
          `}
        >
          {title}
        </div>

        <div
          className={css`
            white-space: nowrap;
            text-overflow: ellipsis;
          `}
        >
          {body}
        </div>
      </VStack>
    </HStack>
  );
}

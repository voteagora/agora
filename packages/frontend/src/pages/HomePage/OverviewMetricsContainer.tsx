import { css } from "@emotion/css";
import { ReactNode } from "react";
import * as theme from "../../theme";
import { icons } from "../../icons/icons";
import { HStack, VStack } from "../../components/VStack";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { OverviewMetricsContainerFragment$key } from "./__generated__/OverviewMetricsContainerFragment.graphql";
import { pluralizeNoun } from "../../words";
import { BigNumber } from "ethers";
import { bpsToString } from "../../utils/bps";

type Props = {
  fragmentRef: OverviewMetricsContainerFragment$key;
};

export function OverviewMetricsContainer({ fragmentRef }: Props) {
  const { metrics } = useFragment(
    graphql`
      fragment OverviewMetricsContainerFragment on Query {
        metrics {
          ownersCount
          delegatesCount

          quorumFloor {
            amount {
              amount
            }

            bpsOfTotal
          }

          proposalThreshold {
            amount {
              amount
            }
          }

          recentVoterTurnoutBps
        }
      }
    `,
    fragmentRef
  );
  return (
    <HStack
      justifyContent="space-between"
      gap="4"
      className={css`
        max-width: ${theme.maxWidth["6xl"]};
        width: 100%;
        flex-wrap: wrap;

        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};

        @media (max-width: ${theme.maxWidth["6xl"]}) {
          justify-content: center;
        }

        @media (max-width: ${theme.maxWidth.lg}) {
          flex-direction: column;
          align-items: stretch;
          gap: ${theme.spacing["2"]};
          background: transparent;
          border-radius: ${theme.spacing["3"]};
          padding: ${theme.spacing["3"]};
          border-width: 0px
          box-shadow: ${theme.boxShadow.none};
        }
      `}
    >
      <MetricContainer
        icon="community"
        title="Voters / Noun Holders"
        body={
          <>
            {metrics.delegatesCount} / {metrics.ownersCount}
          </>
        }
      />

      <MetricContainer
        icon="ballot"
        title="Quorum floor"
        body={
          <>
            {pluralizeNoun(BigNumber.from(metrics.quorumFloor.amount.amount))} (
            {bpsToString(metrics.quorumFloor.bpsOfTotal)} of supply)
          </>
        }
      />

      <MetricContainer
        icon="measure"
        title="Proposal threshold"
        body={`${pluralizeNoun(
          BigNumber.from(metrics.proposalThreshold.amount.amount)
        )}`}
      />

      <MetricContainer
        icon="pedestrian"
        title="Avg voter turnout"
        body={bpsToString(metrics.recentVoterTurnoutBps)}
      />
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

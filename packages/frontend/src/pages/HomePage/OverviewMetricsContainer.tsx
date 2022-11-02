import { css } from "@emotion/css";
import { ReactNode } from "react";
import * as theme from "../../theme";
import { icons } from "../../icons/icons";
import { HStack, VStack } from "../../components/VStack";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { OverviewMetricsContainerFragment$key } from "./__generated__/OverviewMetricsContainerFragment.graphql";
import { TokenAmountDisplay } from "../../components/TokenAmountDisplay";
import { BigNumber } from "ethers";
import { bpsToString } from "../DelegatePage/VoterPanel";

type Props = {
  fragmentRef: OverviewMetricsContainerFragment$key;
};

export function OverviewMetricsContainer({ fragmentRef }: Props) {
  const { metrics } = useFragment(
    graphql`
      fragment OverviewMetricsContainerFragment on Query {
        metrics {
          delegatedSupply {
            amount
            ...TokenAmountDisplayFragment
          }

          totalSupply {
            amount
            ...TokenAmountDisplayFragment
          }

          quorum {
            amount {
              ...TokenAmountDisplayFragment
            }

            bpsOfTotal
          }

          proposalThreshold {
            amount {
              ...TokenAmountDisplayFragment
            }

            bpsOfTotal
          }

          averageVoterTurnOutBps
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
        }
      `}
    >
      <MetricContainer
        icon="community"
        title="Delegated token / Total supply"
        body={
          <>
            <TokenAmountDisplay
              fragment={metrics.delegatedSupply}
              maximumSignificantDigits={1}
            />{" "}
            / <TokenAmountDisplay fragment={metrics.totalSupply} /> (
            {BigNumber.from(metrics.delegatedSupply.amount)
              .mul(100)
              .div(metrics.totalSupply.amount)
              .toNumber()}
            % delegation)
          </>
        }
      />

      <MetricContainer
        icon="ballot"
        title="Quorum"
        body={
          <>
            <TokenAmountDisplay fragment={metrics.quorum.amount} /> (
            {bpsToString(metrics.quorum.bpsOfTotal)} of supply)
          </>
        }
      />

      <MetricContainer
        icon="measure"
        title="Proposal threshold"
        body={
          <>
            <TokenAmountDisplay fragment={metrics.proposalThreshold.amount} /> (
            {bpsToString(metrics.proposalThreshold.bpsOfTotal)} of supply)
          </>
        }
      />

      <MetricContainer
        icon="pedestrian"
        title="Average voter turnout"
        body={bpsToString(metrics.averageVoterTurnOutBps)}
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

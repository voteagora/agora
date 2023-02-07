import { css } from "@emotion/css";
import { ReactNode } from "react";
import * as theme from "../../theme";
import { icons } from "../../icons/icons";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { OverviewMetricsContainer$key } from "./__generated__/OverviewMetricsContainer.graphql";
import { BigNumber } from "ethers";
import { HStack, VStack } from "../../components/VStack";
import { pluralizeNoun } from "../../words";

type Props = {
  fragmentRef: OverviewMetricsContainer$key;
};

export function OverviewMetricsContainer({ fragmentRef }: Props) {
  const { metrics, recentProposals, currentGovernance } = useFragment(
    graphql`
      fragment OverviewMetricsContainer on Query {
        recentProposals: proposals(
          first: 40
          orderBy: createdBlock
          orderDirection: desc
        ) {
          totalVotes
          actualStatus

          createdBlockGovernance {
            delegatedVotes
          }
        }

        metrics {
          quorumVotesBPS
          proposalThresholdBPS
        }

        currentGovernance {
          delegatedVotesRaw
          currentTokenHolders
          currentDelegates
        }
      }
    `,
    fragmentRef
  );

  const quorumBps = BigNumber.from(metrics.quorumVotesBPS);

  const quorumCount = BigNumber.from(currentGovernance.delegatedVotesRaw)
    .mul(quorumBps)
    .div(100 * 100);

  const proposalThreshold = BigNumber.from(currentGovernance.delegatedVotesRaw)
    .mul(metrics.proposalThresholdBPS)
    .div(100 * 100)
    .add(1);

  const recentlyCompletedProposals = recentProposals
    .filter((proposal) => {
      return (
        proposal.actualStatus !== "ACTIVE" &&
        proposal.actualStatus !== "PENDING"
      );
    })
    .slice(0, 10);

  return (
    <HStack
      justifyContent="center"
      className={css`
        width: 100%;
        @media (max-width: ${theme.maxWidth.lg}) {
          padding: ${theme.spacing["4"]};
        }
      `}
    >
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
            gap: 0px;
            background: ${theme.colors.white};
            border-radius: ${theme.spacing["3"]};
            padding: ${theme.spacing["3"]};
            border-width: ${theme.spacing.px};
            border-color: ${theme.colors.gray["300"]};
            box-shadow: ${theme.boxShadow.newDefault};
          }
        `}
      >
        {currentGovernance && (
          <MetricContainer
            icon="community"
            title="Voters / Noun Holders"
            body={`${currentGovernance.currentDelegates} / ${
              currentGovernance.currentTokenHolders
            } (${(
              (1 -
                Number(currentGovernance.currentDelegates) /
                  Number(currentGovernance.currentTokenHolders)) *
              100
            ).toPrecision(2)}% delegation)`}
          />
        )}

        {/* todo: source this from the actual quorum floor value */}
        <MetricContainer
          icon="ballot"
          title="Quorum floor"
          body={`${pluralizeNoun(quorumCount)} (${quorumBps
            .div(100)
            .toNumber()
            .toFixed(0)}% of supply)`}
        />

        <MetricContainer
          icon="measure"
          title="Proposal threshold"
          body={`${pluralizeNoun(proposalThreshold)}`}
        />

        <MetricContainer
          icon="pedestrian"
          title="Avg voter turnout"
          body={(() => {
            if (!recentlyCompletedProposals.length) {
              return "N/A";
            }

            const total = recentlyCompletedProposals.reduce<number>(
              (acc, value) => {
                return (
                  acc +
                  value.totalVotes / value.createdBlockGovernance.delegatedVotes
                );
              },
              0
            );
            return (
              ((total / recentlyCompletedProposals.length) * 100).toPrecision(
                2
              ) + "%"
            );
          })()}
        />
      </HStack>
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
        @media (max-width: ${theme.maxWidth.lg}) {
          padding: ${theme.spacing["2"]} 0;
          border: 0px;
          box-shadow: ${theme.boxShadow.none};
        }
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

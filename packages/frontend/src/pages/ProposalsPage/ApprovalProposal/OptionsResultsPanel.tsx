import { css } from "@emotion/css";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";
import { HStack, VStack } from "../../../components/VStack";
import * as theme from "../../../theme";
import {
  OptionsResultsPanelFragment$data,
  OptionsResultsPanelFragment$key,
} from "./__generated__/OptionsResultsPanelFragment.graphql";
import { TokenAmountDisplay } from "../../../components/TokenAmountDisplay";
import { TokenAmountDisplayFragment$key } from "../../../components/__generated__/TokenAmountDisplayFragment.graphql";
import { BigNumber } from "ethers";
import { OptionsResultsPanelStatusFragment$key } from "./__generated__/OptionsResultsPanelStatusFragment.graphql";
import { ProposalStatus } from "./__generated__/ApprovalCastVoteButtonFragment.graphql";

export type Sort = "desc" | "asc";

type Props = {
  fragmentRef: OptionsResultsPanelFragment$key;
  statusRef: OptionsResultsPanelStatusFragment$key;
};

export function OptionsResultsPanel({ fragmentRef, statusRef }: Props) {
  const { forVotes, abstainVotes, options, settings } = useFragment(
    graphql`
      fragment OptionsResultsPanelFragment on ApprovalVotingProposalData {
        forVotes {
          amount
        }
        abstainVotes {
          amount
        }
        options {
          votes {
            amount
            ...TokenAmountDisplayFragment
          }
          description
          budgetTokensSpent {
            amount
          }
        }
        settings {
          criteria {
            __typename
            ... on TopChoicesVotingCriteria {
              topChoices
            }
            ... on ThresholdVotingCriteria {
              threshold {
                amount
              }
            }
          }
          budget {
            amount
          }
        }
      }
    `,
    fragmentRef
  );

  const { status } = useFragment(
    graphql`
      fragment OptionsResultsPanelStatusFragment on Proposal {
        status
      }
    `,
    statusRef
  );
  const totalVotingPower = BigNumber.from(forVotes.amount).add(
    BigNumber.from(abstainVotes.amount)
  );

  // sort options by forVotes
  const mutableOptions = [...options];
  const sortedOptions = mutableOptions.sort((a: any, b: any) => {
    return BigNumber.from(b.votes.amount).gt(BigNumber.from(a.votes.amount))
      ? 1
      : BigNumber.from(b.votes.amount).lt(BigNumber.from(a.votes.amount))
      ? -1
      : 0;
  });

  let thresholdPosition = 0;

  if (settings.criteria.__typename === "ThresholdVotingCriteria") {
    const threshold = BigNumber.from(settings.criteria.threshold.amount);
    if (totalVotingPower.lt(threshold.mul(15).div(10))) {
      thresholdPosition = 66;
    } else {
      // calculate threshold position, min 5% max 66%
      thresholdPosition = Math.max(
        threshold.mul(100).div(totalVotingPower).toNumber(),
        5
      );
    }
  }

  let availableBudget = BigNumber.from(settings.budget.amount);

  return (
    <VStack
      className={css`
        max-height: calc(
          100vh - 437px
        ); //martin, this is kind of a hack, but it achieves the desired result lol, please don't remove this unless there's a better way
        overflow-y: scroll;
        flex-shrink: 1;
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};
      `}
    >
      {sortedOptions.map((option, index) => {
        let isApproved = false;
        const votesAmountBN = BigNumber.from(option.votes.amount);
        const optionBudget = BigNumber.from(option.budgetTokensSpent.amount);
        if (settings.criteria.__typename === "TopChoicesVotingCriteria") {
          isApproved = index < settings.criteria.topChoices;
        } else if (settings.criteria.__typename === "ThresholdVotingCriteria") {
          const threshold = BigNumber.from(settings.criteria.threshold.amount);
          isApproved =
            votesAmountBN.gte(threshold) && availableBudget.gte(optionBudget);
          if (isApproved) availableBudget = availableBudget.sub(optionBudget);
        }
        return (
          <SingleOption
            key={index}
            description={option.description}
            votes={option.votes}
            votesAmountBN={votesAmountBN}
            totalVotingPower={totalVotingPower}
            status={status}
            settings={settings}
            thresholdPosition={thresholdPosition}
            isApproved={isApproved}
          />
        );
      })}
    </VStack>
  );
}

function SingleOption({
  description,
  votes,
  votesAmountBN,
  totalVotingPower,
  status,
  settings,
  thresholdPosition,
  isApproved,
}: {
  description: string;
  votesAmountBN: BigNumber;
  votes: TokenAmountDisplayFragment$key;
  totalVotingPower: BigNumber;
  status: ProposalStatus;
  settings: OptionsResultsPanelFragment$data["settings"];
  thresholdPosition: number;
  isApproved: boolean;
}) {
  let barPercentage = BigNumber.from(0);
  const percentage = totalVotingPower.isZero()
    ? BigNumber.from(0)
    : votesAmountBN.mul(10000).div(totalVotingPower); // mul by 10_000 to get 2 decimal places, divide by 100 later to use percentage

  if (settings.criteria.__typename === "TopChoicesVotingCriteria") {
    barPercentage = percentage;
  } else if (settings.criteria.__typename === "ThresholdVotingCriteria") {
    const threshold = BigNumber.from(settings.criteria.threshold.amount);
    barPercentage = getScaledBarPercentage({
      threshold,
      totalVotingPower,
      votesAmountBN,
      thresholdPosition,
    });
  }

  return (
    <div>
      <HStack
        className={css`
          justify-content: space-between;
          font-weight: ${theme.fontWeight.medium};
          font-size: ${theme.fontSize.sm};
          margin-bottom: ${theme.spacing["1"]};
        `}
      >
        <div
          className={css`
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            max-width: ${theme.spacing["48"]};
          `}
        >
          {description}
        </div>
        <div
          className={css`
            color: ${theme.colors.gray[700]};
          `}
        >
          <TokenAmountDisplay fragment={votes} />
          <span
            className={css`
              margin-left: ${theme.spacing["1"]};
            `}
          >
            {percentage.isZero()
              ? "(0%)"
              : "(" + Math.round(Number(percentage) / 100).toString() + "%)"}
          </span>
        </div>
      </HStack>
      <ProgressBar
        barPercentage={barPercentage}
        status={status}
        isApproved={isApproved}
        thresholdPosition={thresholdPosition}
      />
    </div>
  );
}

export function ProgressBar({
  barPercentage,
  status,
  isApproved,
  thresholdPosition,
}: {
  barPercentage: BigNumber;
  status: ProposalStatus;
  isApproved: boolean;
  thresholdPosition: number;
}) {
  return (
    <HStack>
      <div
        className={css`
          width: 100%;
          height: 6px;
          border-radius: 10px;
          background-color: ${theme.colors.gray.eo};
          position: relative;
          margin-bottom: ${theme.spacing["3"]};
        `}
      >
        <div
          className={css`
            width: ${Math.max(
              Number(barPercentage) / 100,
              Number(barPercentage) !== 0 ? 1 : 0
            )
              .toFixed(2)
              .toString()}%;
            height: 6px;
            background-color: ${isApproved
              ? status === "EXECUTED" || status === "SUCCEEDED"
                ? theme.colors.green.positive
                : theme.colors.green.positive
              : theme.colors.gray["4f"]};
            position: absolute;
            border-radius: 10px;
            top: 0;
            right: 0;
          `}
        ></div>
        {!!thresholdPosition && (
          <div
            className={css`
              width: 2px;
              height: 6px;
              background-color: ${theme.colors.gray["4f"]};
              position: absolute;
              border-radius: 10px;
              top: 0;
              right: ${thresholdPosition}%;
            `}
          ></div>
        )}
      </div>
    </HStack>
  );
}

function getScaledBarPercentage({
  threshold,
  totalVotingPower,
  votesAmountBN,
  thresholdPosition,
}: {
  threshold: BigNumber;
  totalVotingPower: BigNumber;
  votesAmountBN: BigNumber;
  thresholdPosition: number;
}) {
  let barPercentage = BigNumber.from(0);

  if (totalVotingPower.isZero()) {
    barPercentage = BigNumber.from(0);
  } else if (totalVotingPower.lt(threshold.mul(15).div(10))) {
    // here thresholdPosition is 66%
    // adjust percentage based on thresholdPosition
    barPercentage = votesAmountBN.mul(10000).div(threshold.mul(15).div(10));
  } else if (totalVotingPower.gte(threshold.mul(15).div(10))) {
    // here thresholdPosition is calculated based on threshold and totalVotingPower, min 5% max 66%
    barPercentage = votesAmountBN.mul(10000).div(totalVotingPower);

    // handle case where barPercentage is less than thresholdPosition but votesAmountBN is greater than threshold
    if (votesAmountBN.gte(threshold)) {
      barPercentage.div(100).lte(thresholdPosition) &&
        (barPercentage = BigNumber.from(thresholdPosition * 100 + 100));
    } else {
      // handle case where barPercentage is greater than thresholdPosition but votesAmountBN is less than threshold
      barPercentage.div(100).gte(thresholdPosition) &&
        (barPercentage = BigNumber.from(thresholdPosition * 100 - 100));
    }
  }

  return barPercentage;
}

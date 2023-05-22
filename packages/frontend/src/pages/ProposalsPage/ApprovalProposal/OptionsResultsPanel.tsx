import { css } from "@emotion/css";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";
import { HStack, VStack } from "../../../components/VStack";
import * as theme from "../../../theme";
import { OptionsResultsPanelFragment$key } from "./__generated__/OptionsResultsPanelFragment.graphql";
import { TokenAmountDisplay } from "../../../components/TokenAmountDisplay";
import { TokenAmountDisplayFragment$key } from "../../../components/__generated__/TokenAmountDisplayFragment.graphql";
import { BigNumber } from "ethers";
import { OptionsResultsPanelStatusFragment$key } from "./__generated__/OptionsResultsPanelStatusFragment.graphql";
import { ProposalStatus } from "./__generated__/ApprovalCastVoteButtonFragment.graphql";

export type Filter =
  | "PENDING"
  | "ACTIVE"
  | "CANCELLED"
  | "VETOED"
  | "QUEUED"
  | "EXECUTED"
  | "DEFEATED"
  | "EXPIRED"
  | "ALL";

export type Sort = "desc" | "asc";

type Props = {
  fragmentRef: OptionsResultsPanelFragment$key;
  statusRef: OptionsResultsPanelStatusFragment$key;
};

export function OptionsResultsPanel({ fragmentRef, statusRef }: Props) {
  const proposalData = useFragment(
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
        }
        settings {
          criteria {
            __typename
            ... on TopChoicesVotingCriteria {
              topChoices
            }
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
  const totalVotingPower = BigNumber.from(proposalData.forVotes.amount).add(
    BigNumber.from(proposalData.abstainVotes.amount)
  );

  // sort options by forVotes
  const options = [...proposalData.options];
  const sortedOptions = options.sort((a: any, b: any) => {
    return BigNumber.from(b.votes.amount).gt(BigNumber.from(a.votes.amount))
      ? 1
      : BigNumber.from(b.votes.amount).lt(BigNumber.from(a.votes.amount))
      ? -1
      : 0;
  });

  return (
    <VStack
      className={css`
        max-height: calc(
          100vh - 417px
        ); //martin, this is kind of a hack, but it achieves the desired result lol, please don't remove this unless there's a better way
        overflow-y: scroll;
        flex-shrink: 1;
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};
      `}
    >
      {sortedOptions.map((option, index) => {
        const isApproved =
          proposalData.settings.criteria.__typename ===
          "TopChoicesVotingCriteria"
            ? index < proposalData.settings.criteria.topChoices
            : false;

        return (
          <SingleOption
            key={index}
            description={option.description}
            votes={option.votes}
            votesAmount={option.votes.amount}
            totalVotingPower={totalVotingPower}
            isApproved={isApproved}
            status={status}
          />
        );
      })}
    </VStack>
  );
}

function SingleOption({
  description,
  votes,
  votesAmount,
  totalVotingPower,
  isApproved,
  status,
}: {
  description: string;
  votesAmount: string;
  votes: TokenAmountDisplayFragment$key;
  totalVotingPower: BigNumber;
  isApproved: boolean;
  status: ProposalStatus;
}) {
  const percentage = totalVotingPower.isZero()
    ? BigNumber.from(0)
    : BigNumber.from(votesAmount).mul(10000).div(totalVotingPower); // divide percentage by 100 to get 2 decimal places

  return (
    <div>
      <HStack
        className={css`
          justify-content: space-between;
          font-weight: ${theme.fontWeight.semibold};
          font-size: ${theme.fontSize.sm};
          margin-bottom: ${theme.spacing["1"]};
        `}
      >
        <p
          className={css`
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            max-width: 50%;
          `}
        >
          {description}
        </p>
        <div>
          <TokenAmountDisplay fragment={votes} />
          <span
            className={css`
              margin-left: ${theme.spacing["2"]};
            `}
          >
            {percentage.isZero()
              ? "(0%)"
              : "(" + Math.round(Number(percentage) / 100).toString() + "%)"}
          </span>
        </div>
      </HStack>
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
              width: ${(Number(percentage) / 100).toFixed(2).toString()}%;
              height: 6px;
              background-color: ${isApproved
                ? status === "EXECUTED"
                  ? theme.colors.green["600"]
                  : theme.colors.orange["400"]
                : theme.colors.gray["4f"]};
              position: absolute;
              border-radius: 10px;
              top: 0;
              right: 0;
            `}
          ></div>
        </div>
      </HStack>
    </div>
  );
}

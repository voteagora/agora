import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoteDetailsFragment$key } from "./__generated__/VoteDetailsFragment.graphql";
import { VStack } from "../../components/VStack";
import {
  colorForSupportType,
  toSupportType,
  ValuePart,
  VoteDetailsContainer,
  VoteTitle,
} from "./VoteDetailsContainer";
import { pluralizeVote } from "../../words";
import { BigNumber } from "ethers";
import { formatDistanceToNow } from "date-fns";
import { VoteReason } from "../../components/VoteReason";

type Props = {
  voteFragment: VoteDetailsFragment$key;
};

export function VoteDetails({ voteFragment }: Props) {
  const vote = useFragment(
    graphql`
      fragment VoteDetailsFragment on Vote {
        reason
        ...VoteReasonFragment
        supportDetailed
        votes {
          amount {
            amount
            decimals
          }
        }
        transaction {
          block {
            timestamp
          }
        }

        proposal {
          number
          title

          totalValue
        }
      }
    `,
    voteFragment
  );

  const proposalHref = `https://www.tally.xyz/governance/eip155:1:0x323A76393544d5ecca80cd6ef2A560C6a395b7E3/proposal/${vote.proposal.number}`;

  const supportType = toSupportType(vote.supportDetailed);

  return (
    <VoteDetailsContainer>
      <div
        className={css`
          display: grid;
          overflow-y: hidden;
          grid-template-columns: 1fr 1px 1fr;

          @media (max-width: ${theme.maxWidth["2xl"]}) {
            grid-template-rows: 1fr;
            grid-template-columns: none;
            overflow-y: scroll;
          }
        `}
      >
        <VStack
          className={css`
            padding: ${theme.spacing["4"]} ${theme.spacing["6"]};
          `}
        >
          <div
            className={css`
              font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.medium};
              color: #66676b;
            `}
          >
            <a href={proposalHref} title={`Prop ${vote.proposal.number}`}>
              Prop {shortenId(vote.proposal.number)}
            </a>
            <ValuePart value={vote.proposal.totalValue} />
            {vote.transaction.block.timestamp &&
              ` - ${formatDistanceToNow(
                new Date(vote.transaction.block.timestamp)
              )} ago`}
          </div>

          <VoteTitle>
            <a href={proposalHref}>{vote.proposal.title}</a>
          </VoteTitle>

          <span
            className={css`
              color: ${colorForSupportType(supportType)};
              font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.medium};
            `}
          >
            <span
              className={css`
                text-transform: capitalize;
              `}
            >
              {supportType.toLowerCase()}
            </span>{" "}
            with{" "}
            {pluralizeVote(
              BigNumber.from(vote.votes.amount.amount),
              vote.votes.amount.decimals
            )}
          </span>
        </VStack>

        {vote.reason && (
          <>
            <div
              className={css`
                width: ${theme.spacing.px};
                background: #ebebeb;

                @media (max-width: ${theme.maxWidth["2xl"]}) {
                  display: none;
                }
              `}
            />

            <VStack
              className={css`
                overflow-y: scroll;
                overflow-x: scroll;
                padding: ${theme.spacing["4"]} ${theme.spacing["6"]};

                @media (max-width: ${theme.maxWidth["2xl"]}) {
                  padding-top: 0;
                  height: fit-content;
                }
              `}
            >
              <VoteReason fragmentKey={vote} />
            </VStack>
          </>
        )}
      </div>
    </VoteDetailsContainer>
  );
}

export function shortenId(id: string) {
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}

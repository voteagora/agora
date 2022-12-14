import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import {
  colorForSupportType,
  VoteDetailsContainer,
  VoteTitle,
} from "./VoteDetailsContainer";
import { VStack } from "../../components/VStack";
import { PropHouseVoteDetailsFragment$key } from "./__generated__/PropHouseVoteDetailsFragment.graphql";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { formatDistanceToNow } from "date-fns";
import { pluralizeVote } from "../../words";
import { BigNumber } from "ethers";

type Props = {
  voteFragment: PropHouseVoteDetailsFragment$key;
};

export function PropHouseVoteDetails({ voteFragment }: Props) {
  const vote = useFragment(
    graphql`
      fragment PropHouseVoteDetailsFragment on PropHouseRoundVotes {
        createdAt
        round {
          title
          currencyType
          fundingAmount
        }

        votes {
          proposal {
            number
            title
          }

          weight
        }
      }
    `,
    voteFragment
  );

  const roundSlug = vote.round.title.split(" ").join("-").toLowerCase();

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
            Nouns Prop House funding {vote.round.fundingAmount} x{" "}
            {vote.round.currencyType} -{" "}
            {formatDistanceToNow(Number(vote.createdAt))} ago
          </div>

          <VoteTitle>
            <a href={`https://prop.house/nouns/${roundSlug}`}>
              {vote.round.title}
            </a>
          </VoteTitle>
        </VStack>

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

            color: #66676b;
            font-size: ${theme.fontSize.xs};
          `}
        >
          <div
            className={css`
              padding: ${theme.spacing["4"]} ${theme.spacing["6"]};
              width: fit-content;

              @media (max-width: ${theme.maxWidth["2xl"]}) {
                padding-top: 0;
                height: fit-content;
              }
            `}
          >
            {vote.votes.map((vote) => (
              <div
                className={css`
                  white-space: nowrap;
                  text-overflow: ellipsis;
                `}
              >
                <a
                  className={css`
                    color: ${colorForSupportType("FOR")};
                  `}
                  href={`https://prop.house/nouns/${roundSlug}/${vote.proposal.number}`}
                >
                  {pluralizeVote(BigNumber.from(vote.weight))} for{" "}
                  {vote.proposal.title}
                </a>
              </div>
            ))}
          </div>
        </VStack>
      </div>
    </VoteDetailsContainer>
  );
}

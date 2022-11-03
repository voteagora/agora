import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VStack } from "../../components/VStack";
import { VoteDetailsContainer, VoteTitle } from "./VoteDetailsContainer";
import { formatDistanceToNow } from "date-fns";
import { SnapshotVoteDetailsFragment$key } from "./__generated__/SnapshotVoteDetailsFragment.graphql";

type Props = {
  voteFragment: SnapshotVoteDetailsFragment$key;
};

export function SnapshotVoteDetails({ voteFragment }: Props) {
  const vote = useFragment(
    graphql`
      fragment SnapshotVoteDetailsFragment on SnapshotVote {
        selectedChoiceIdx
        reason
        createdAt

        proposal {
          title
          link

          choices {
            title
            score
          }
        }
      }
    `,
    voteFragment
  );

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
            Snapshot Vote
            {vote.createdAt && ` - ${formatDistanceToNow(vote.createdAt)} ago`}
          </div>

          <VoteTitle>
            <a href={vote.proposal.link}>{vote.proposal.title}</a>
          </VoteTitle>

          <span
            className={css`
              font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.medium};
            `}
          >
            <span
              className={css`
                text-transform: capitalize;
              `}
            >
              {vote.proposal.choices[vote.selectedChoiceIdx - 1].title}
            </span>{" "}
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
              <div
                className={css`
                  font-size: ${theme.fontSize.xs};
                  font-weight: ${theme.fontWeight.medium};
                  color: #66676b;
                  width: fit-content;
                `}
              >
                {vote.reason}
              </div>
            </VStack>
          </>
        )}
      </div>
    </VoteDetailsContainer>
  );
}

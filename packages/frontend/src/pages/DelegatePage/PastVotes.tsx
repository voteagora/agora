import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoteDetails } from "./VoteDetails";
import { PastVotesFragment$key } from "./__generated__/PastVotesFragment.graphql";

type Props = {
  fragment: PastVotesFragment$key;
};

export function PastVotes({ fragment }: Props) {
  const { votes } = useFragment(
    graphql`
      fragment PastVotesFragment on Delegate {
        votes(orderBy: blockNumber, orderDirection: desc) {
          id
          ...VoteDetailsFragment
        }
      }
    `,
    fragment
  );

  if (!votes.length) {
    return null;
  }

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
      `}
    >
      <h2
        className={css`
          font-size: ${theme.fontSize["2xl"]};
          font-weight: bold;
        `}
      >
        Past Votes
      </h2>

      <div
        className={css`
          display: flex;
          flex-direction: column;
          margin-top: ${theme.spacing["4"]};
          gap: ${theme.spacing["4"]};
        `}
      >
        {votes.map((vote) => (
          <VoteDetails key={vote.id} voteFragment={vote} />
        ))}
      </div>
    </div>
  );
}

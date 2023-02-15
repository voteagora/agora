import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VStack } from "../../components/VStack";
import {
  colorForSupportType,
  VoteDetailsContainer,
  VoteTitle,
} from "./VoteDetailsContainer";
import { formatDistanceToNow } from "date-fns";
import { SnapshotVoteDetailsFragment$key } from "./__generated__/SnapshotVoteDetailsFragment.graphql";
import { SnapshotVoteDetailsVoteChoiceFragment$key } from "./__generated__/SnapshotVoteDetailsVoteChoiceFragment.graphql";
import { pluralizeVote } from "../../words";
import { BigNumber } from "ethers";

type Props = {
  voteFragment: SnapshotVoteDetailsFragment$key;
};

export function SnapshotVoteDetails({ voteFragment }: Props) {
  const vote = useFragment(
    graphql`
      fragment SnapshotVoteDetailsFragment on SnapshotVote {
        reason
        createdAt

        proposal {
          title
          link

          choices {
            title
          }
        }

        ...SnapshotVoteDetailsVoteChoiceFragment
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
            <SnapshotVoteChoicePart fragment={vote} />
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

export function SnapshotVoteChoicePart({
  fragment,
}: {
  fragment: SnapshotVoteDetailsVoteChoiceFragment$key;
}) {
  const vote = useFragment(
    graphql`
      fragment SnapshotVoteDetailsVoteChoiceFragment on SnapshotVote {
        votingPower

        choice {
          __typename
          ... on SnapshotVoteChoiceSingle {
            selectedChoiceIdx
          }

          ... on SnapshotVoteChoiceWeighted {
            weights {
              choiceIdx
              weight
            }
          }

          ... on SnapshotVoteChoiceRanked {
            choices
          }

          ... on SnapshotVoteChoiceApproval {
            approvedChoices
          }

          ... on SnapshotVoteChoiceQuadratic {
            weights {
              weight
              choiceIdx
            }
          }
        }

        proposal {
          choices {
            title
          }
        }
      }
    `,
    fragment
  );

  const withPart = (
    <span>
      with {pluralizeVote(BigNumber.from(Math.floor(vote.votingPower)), 0)}
    </span>
  );

  switch (vote.choice.__typename) {
    case "SnapshotVoteChoiceApproval": {
      return (
        <span
          className={css`
            color: ${colorForSupportType("FOR")};
          `}
        >
          {vote.choice.approvedChoices
            .map((idx) => vote.proposal.choices[idx - 1])
            .map((choice) => choice.title)
            .join(", ")}{" "}
          {withPart}
        </span>
      );
    }

    case "SnapshotVoteChoiceSingle": {
      const choiceName =
        vote.proposal.choices[vote.choice.selectedChoiceIdx - 1].title;

      return (
        <span
          className={css`
            color: ${colorForSupportType(
              asSupportType(choiceName) ?? "ABSTAIN"
            )};
          `}
        >
          {choiceName} {withPart}
        </span>
      );
    }

    case "SnapshotVoteChoiceRanked": {
      return (
        <span
          className={css`
            color: ${colorForSupportType("FOR")};
          `}
        >
          {vote.choice.choices
            .map((idx) => vote.proposal.choices[idx - 1])
            .map(({ title }, idx) => `${idx + 1}. ${title}`)
            .join(", ")}{" "}
          {withPart}
        </span>
      );
    }

    case "SnapshotVoteChoiceQuadratic":
    case "SnapshotVoteChoiceWeighted": {
      const totalWeight = vote.choice.weights.reduce(
        (acc, value) => value.weight + acc,
        0
      );

      return (
        <span
          className={css`
            color: ${colorForSupportType("FOR")};
          `}
        >
          {vote.choice.weights
            .map(({ choiceIdx, weight }) => {
              const choice = vote.proposal.choices[choiceIdx];

              return { choice, weight };
            })
            .map(({ choice, weight }) => {
              return `${weight / totalWeight} for ${choice.title}`;
            })
            .join(", ")}{" "}
          {withPart}
        </span>
      );
    }
  }

  return null;
}

function asSupportType(string: string): "FOR" | "AGAINST" | "ABSTAIN" | null {
  const normalized = string.toUpperCase();
  if (["FOR", "AGAINST", "ABSTAIN"].includes(normalized)) {
    return normalized as any;
  }

  return null;
}

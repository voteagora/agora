import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoteDetails } from "./VoteDetails";
import { PastVotesFragment$key } from "./__generated__/PastVotesFragment.graphql";
import { HStack, VStack } from "../../components/VStack";
import { Selector } from "../HomePage/Selector";
import { useMemo, useState } from "react";
import { BigNumber } from "ethers";
import { descendingValueComparator } from "./VoterPanel";
import { SnapshotVoteDetails } from "./SnapshotVoteDetails";

type Props = {
  fragment: PastVotesFragment$key;
};

type Filter = "ALL" | "SNAPSHOT" | "ONCHAIN";

type Sort = "MOST_RECENT" | "LEAST_RECENT" | "MOST_ETH" | "LEAST_ETH";

export function PastVotes({ fragment }: Props) {
  const { votes, snapshotVotes } = useFragment(
    graphql`
      fragment PastVotesFragment on Delegate {
        snapshotVotes {
          id
          createdAt

          ...SnapshotVoteDetailsFragment
        }

        votes {
          id
          transaction {
            block {
              timestamp
            }
          }
          proposal {
            totalValue
          }

          ...VoteDetailsFragment
        }
      }
    `,
    fragment
  );

  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("MOST_RECENT");

  const allVotes = useMemo(
    () => [
      ...snapshotVotes.map((vote) => ({
        type: "SNAPSHOT" as const,
        createdAt: vote.createdAt,
        amountEth: BigNumber.from(0),
        vote,
      })),
      ...votes.map((vote) => ({
        type: "ON_CHAIN" as const,
        createdAt: vote.transaction.block.timestamp,
        amountEth: BigNumber.from(vote.proposal.totalValue),
        vote,
      })),
    ],
    [votes, snapshotVotes]
  );

  const filteredVotes = useMemo(
    () =>
      allVotes.filter((value) => {
        switch (filter) {
          case "ALL":
            return true;

          case "ONCHAIN":
            return value.type === "ON_CHAIN";

          case "SNAPSHOT":
            return value.type === "SNAPSHOT";

          default:
            throw new Error("this is impossible");
        }
      }),
    [allVotes, filter]
  );

  const sortedVotes = useMemo(() => {
    switch (sort) {
      case "MOST_RECENT":
        return filteredVotes.sort(
          descendingValueComparator((it) => it.createdAt.valueOf())
        );

      case "LEAST_RECENT":
        return filteredVotes
          .sort(descendingValueComparator((it) => it.createdAt.valueOf()))
          .reverse();

      case "MOST_ETH":
        return filteredVotes
          .sort((a, b) =>
            a.amountEth.eq(b.amountEth)
              ? 0
              : a.amountEth.lt(b.amountEth)
              ? -1
              : 1
          )
          .reverse();

      case "LEAST_ETH":
        return filteredVotes.sort((a, b) =>
          a.amountEth.eq(b.amountEth) ? 0 : a.amountEth.lt(b.amountEth) ? -1 : 1
        );
    }
  }, [filteredVotes, sort]);

  if (!allVotes.length) {
    return null;
  }

  return (
    <VStack gap="4">
      <HStack justifyContent="space-between">
        <h2
          className={css`
            font-size: ${theme.fontSize["2xl"]};
            font-weight: bold;
          `}
        >
          Past Votes
        </h2>

        <HStack gap="4">
          <Selector
            items={[
              {
                title: "Newest",
                value: "MOST_RECENT" as const,
              },
              {
                title: "Oldest",
                value: "LEAST_RECENT" as const,
              },
              {
                title: "Most ETH",
                value: "MOST_ETH" as const,
              },
              {
                title: "Least ETH",
                value: "LEAST_ETH" as const,
              },
            ]}
            value={sort}
            onChange={(newSort) => setSort(newSort)}
          />

          <Selector
            items={[
              {
                title: "Show All",
                value: "ALL" as const,
              },
              { title: "Snapshot", value: "SNAPSHOT" as const },
              {
                title: "Onchain",
                value: "ONCHAIN" as const,
              },
            ]}
            value={filter}
            onChange={(newFilter) => setFilter(newFilter)}
          />
        </HStack>
      </HStack>

      <VStack gap="4">
        {sortedVotes.map((vote, idx) => {
          const key = [idx, vote.vote.id, vote.type].join("|");

          switch (vote.type) {
            case "ON_CHAIN":
              return <VoteDetails key={key} voteFragment={vote.vote} />;

            case "SNAPSHOT":
              return <SnapshotVoteDetails key={key} voteFragment={vote.vote} />;

            default:
              throw new Error(`unknown vote type ${(vote as any).type}`);
          }
        })}
      </VStack>
    </VStack>
  );
}

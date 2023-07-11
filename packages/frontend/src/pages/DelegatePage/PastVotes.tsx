import { useFragment, graphql } from "react-relay";
import { css } from "@emotion/css";
import { useMemo, useState } from "react";
import { BigNumber, utils } from "ethers";

import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { Selector } from "../HomePage/Selector";
import { descendingValueComparator } from "../../utils/sorting";

import { VoteDetails } from "./VoteDetails";
import { PastVotesFragment$key } from "./__generated__/PastVotesFragment.graphql";
import { PropHouseVoteDetails } from "./PropHouseVoteDetails";
import { VoterContributionGraph } from "./VoterContributionGraph";

export type OnChainProposal = {
  id: string;
  number: string;
  status: string;
  title: string;
  voteEndsAt: number;
};

type Props = {
  delegateFragment: PastVotesFragment$key;
  onChainProposals: readonly OnChainProposal[];
};

type Filter = "ALL" | "PROP_HOUSE" | "ONCHAIN";

type Sort = "MOST_RECENT" | "LEAST_RECENT" | "MOST_ETH" | "LEAST_ETH";

export function PastVotes({ delegateFragment, onChainProposals }: Props) {
  const { votes, propHouseVotes, ...voterGraphData } = useFragment(
    graphql`
      fragment PastVotesFragment on Delegate {
        votes {
          id
          approximateTimestamp

          proposal {
            totalValue
          }

          ...VoteDetailsFragment
        }

        propHouseVotes {
          id
          createdAt
          round {
            fundingAmount
            currencyType
          }

          ...PropHouseVoteDetailsFragment
        }

        ...VoterContributionGraphFragment
      }
    `,
    delegateFragment
  );

  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("MOST_RECENT");

  const allVotes = useMemo(
    () => [
      ...votes.map((vote) => ({
        type: "ON_CHAIN" as const,
        createdAt: new Date(vote.approximateTimestamp),
        amountEth: BigNumber.from(vote.proposal.totalValue),
        vote,
      })),
      ...propHouseVotes.map((vote) => ({
        type: "PROP_HOUSE" as const,
        createdAt: new Date(vote.createdAt),
        amountEth:
          vote.round.currencyType === "ETH"
            ? utils.parseEther(vote.round.fundingAmount)
            : BigNumber.from(0),
        vote,
      })),
    ],
    [votes, propHouseVotes]
  );

  const filteredVotes = useMemo(
    () =>
      allVotes.filter((value) => {
        switch (filter) {
          case "ALL":
            return true;

          case "ONCHAIN":
            return value.type === "ON_CHAIN";

          case "PROP_HOUSE":
            return value.type === "PROP_HOUSE";

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
      <HStack
        justifyContent="space-between"
        className={css`
          @media (max-width: ${theme.maxWidth.lg}) {
            flex-direction: column;
            gap: ${theme.spacing[2]};
          }
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
            size={"l"}
          />

          <Selector
            items={[
              {
                title: `Show All (${votes.length + propHouseVotes.length})`,
                value: "ALL" as const,
              },
              {
                title: `Prop House (${propHouseVotes.length})`,
                value: "PROP_HOUSE" as const,
              },
              {
                title: `Onchain (${votes.length})`,
                value: "ONCHAIN" as const,
              },
            ]}
            value={filter}
            onChange={(newFilter) => setFilter(newFilter)}
            size={"l"}
          />
        </HStack>
      </HStack>
      <VoterContributionGraph
        pastVotesFragmentRef={voterGraphData}
        onChainProposals={onChainProposals}
      />

      <VStack gap="4">
        {sortedVotes.map((vote) => {
          const key = [vote.vote.id, vote.type].join("|");

          switch (vote.type) {
            case "ON_CHAIN":
              return <VoteDetails key={key} voteFragment={vote.vote} />;

            case "PROP_HOUSE":
              return (
                <PropHouseVoteDetails key={key} voteFragment={vote.vote} />
              );

            default:
              throw new Error(`unknown vote type ${(vote as any).type}`);
          }
        })}
      </VStack>
    </VStack>
  );
}

import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { ProposalSortType } from "./ProposalSortSelector";
import { ProposalStatusFilter } from "./ProposalStatusSelector";
import { useMemo } from "react";
import { compareBy } from "../../utils/sorting";
import { ProposalTypeFilter } from "./ProposalTypeSelector";
import {
  useProposalsInnerFragment$data,
  useProposalsInnerFragment$key,
} from "./__generated__/useProposalsInnerFragment.graphql";

export function useProposals<
  Proposals extends useProposalsInnerFragment$data["proposals"][0],
  PropHouseRound extends useProposalsInnerFragment$data["propHouseAuctions"][0]
>(
  {
    proposals,
    propHouseAuctions,
  }: {
    proposals: ReadonlyArray<Proposals>;
    propHouseAuctions: ReadonlyArray<PropHouseRound>;
  },

  sort: ProposalSortType,
  filter: ProposalTypeFilter,
  status: ProposalStatusFilter
) {
  const combinedProposals = useMemo(
    () => [
      ...proposals.map((proposal) => ({
        type: "ON_CHAIN" as const,
        proposal,
      })),
      ...propHouseAuctions.map((auction) => ({
        type: "PROP_HOUSE_AUCTION" as const,
        auction,
      })),
    ],
    [proposals, propHouseAuctions]
  );

  const displayedProposals = useMemo(() => {
    return combinedProposals
      .filter((proposal) => {
        switch (filter) {
          case "ALL":
            return true;

          case "PROP_HOUSE_AUCTION":
            return proposal.type === "PROP_HOUSE_AUCTION";

          case "ON_CHAIN":
            return proposal.type === "ON_CHAIN";

          default:
            throw new Error(`unknown ${filter}`);
        }
      })
      .filter((proposal) => {
        if (status === "ALL") {
          return true;
        }

        switch (proposal.type) {
          case "ON_CHAIN":
            return proposal.proposal.status === status;

          case "PROP_HOUSE_AUCTION":
            return proposal.auction.status === status;

          default:
            throw new Error(`impossible state`);
        }
      });
  }, [filter, combinedProposals, status]);

  return useMemo(() => {
    const sorted = displayedProposals.slice().sort(
      compareBy((it) => {
        switch (it.type) {
          case "PROP_HOUSE_AUCTION":
            return new Date(it.auction.startTime);

          case "ON_CHAIN":
            return new Date(it.proposal.voteStartsAt);
        }
      })
    );

    switch (sort) {
      case "NEWEST":
        return sorted.slice().reverse();

      case "OLDEST":
        return sorted;
    }
  }, [displayedProposals, sort]);
}

// eslint-disable-next-line
function useProposalsInnerFragmentHolder(
  fragmentRef: useProposalsInnerFragment$key
) {
  return useFragment(
    graphql`
      fragment useProposalsInnerFragment on Query {
        proposals {
          status
          voteStartsAt
        }

        propHouseAuctions {
          startTime
          status
        }
      }
    `,
    fragmentRef
  );
}

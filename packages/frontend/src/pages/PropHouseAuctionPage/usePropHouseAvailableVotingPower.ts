import graphql from "babel-plugin-relay/macro";
import { groupBy } from "lodash";
import { useMemo } from "react";
import { useFragment } from "react-relay";

import { COMMUNITY_ADDRESS } from "./PropHouseAuctionPage";
import { usePropHouseAvailableVotingPowerAuctionFragment$key } from "./__generated__/usePropHouseAvailableVotingPowerAuctionFragment.graphql";
import {
  usePropHouseAvailableVotingPowerFragmentDelegateFragment$data,
  usePropHouseAvailableVotingPowerFragmentDelegateFragment$key,
} from "./__generated__/usePropHouseAvailableVotingPowerFragmentDelegateFragment.graphql";
import { useTotalVotingPower } from "./propHouse";

export type AvailableVotingPower = {
  address: string;
  availableVotingPower: number;
};

export type VotingAddress =
  | {
      type: "DELEGATED_TOKENS";
      address: string;
    }
  | {
      type: "LIQUID_DELEGATED_TOKENS";
      address: string;
      lots: usePropHouseAvailableVotingPowerFragmentDelegateFragment$data["liquidRepresentation"][0]["lots"];
    };

export function usePropHouseAvailableVotingPower(
  delegateFragmentRef: usePropHouseAvailableVotingPowerFragmentDelegateFragment$key,
  auctionFragmentRef: usePropHouseAvailableVotingPowerAuctionFragment$key
) {
  const {
    address: {
      resolvedName: { address },
    },
    liquidRepresentation,
  } = useFragment(
    graphql`
      fragment usePropHouseAvailableVotingPowerFragmentDelegateFragment on Delegate {
        address {
          resolvedName {
            address
          }
        }

        liquidRepresentation(filter: { canSign: true, currentlyActive: true }) {
          proxy {
            address {
              resolvedName {
                address
              }
            }

            nounsRepresented {
              __typename
            }
          }

          lots {
            # eslint-disable-next-line relay/unused-fields
            authorityChain
          }
        }
      }
    `,
    delegateFragmentRef
  );

  const { votes: auctionVotes, number } = useFragment(
    graphql`
      fragment usePropHouseAvailableVotingPowerAuctionFragment on PropHouseAuction {
        number

        votes {
          address {
            resolvedName {
              address
            }
          }

          weight
        }
      }
    `,
    auctionFragmentRef
  );

  const votingAddresses: VotingAddress[] = useMemo(() => {
    return [
      {
        type: "DELEGATED_TOKENS" as const,
        address,
      },
      ...liquidRepresentation.flatMap((it) => {
        if (!it.proxy.nounsRepresented.length) {
          return [];
        }

        return {
          type: "LIQUID_DELEGATED_TOKENS" as const,
          address: it.proxy.address.resolvedName.address,
          lots: it.lots,
        };
      }),
    ];
  }, [address, liquidRepresentation]);

  const totalVotingPowers = useTotalVotingPower({
    auctionId: number.toString(),
    addresses: votingAddresses.map((it) => it.address),
    communityAddress: COMMUNITY_ADDRESS,
  });

  const consumedVotingPowers = Object.entries(
    groupBy(
      auctionVotes,
      (auctionVote) => auctionVote.address.resolvedName.address
    )
  )
    .map(([address, votes]) => ({
      address,
      votes,
    }))
    .filter(({ address }) =>
      totalVotingPowers.find((it) => it.address === address)
    )
    .map(({ address, votes }) => ({
      address,
      consumedVotingPower: votes.reduce((acc, it) => it.weight + acc, 0),
    }));

  const votingPower = totalVotingPowers.map(
    ({ votingPower: totalVotingPower, address }) => {
      const consumedVotingPower =
        consumedVotingPowers.find((it) => it.address === address)
          ?.consumedVotingPower ?? 0;

      const availableVotingPower = Math.max(
        totalVotingPower - consumedVotingPower,
        0
      );

      return {
        address,
        availableVotingPower,
      };
    }
  );

  return {
    votingPower,
    votingAddresses,
  };
}

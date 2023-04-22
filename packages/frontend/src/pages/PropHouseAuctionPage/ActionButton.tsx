import { css } from "@emotion/css";
import graphql from "babel-plugin-relay/macro";
import { useCallback } from "react";
import { useFragment } from "react-relay";

import { useOpenDialog } from "../../components/DialogProvider/DialogProvider";
import { VStack } from "../../components/VStack";
import * as theme from "../../theme";
import {
  DisabledVoteButton,
  voteButtonStyles,
} from "../ProposalsPage/CastVoteInput";

import { usePendingVotes } from "./PendingVotesContext";
import { ActionButtonFragment$key } from "./__generated__/ActionButtonFragment.graphql";
import { ActionButtonVoteButtonAuctionFragment$key } from "./__generated__/ActionButtonVoteButtonAuctionFragment.graphql";
import { ActionButtonVoteButtonDelegateFragment$key } from "./__generated__/ActionButtonVoteButtonDelegateFragment.graphql";
import { usePropHouseAvailableVotingPower } from "./usePropHouseAvailableVotingPower";

export function ActionButton({
  delegateFragmentRef,
  fragmentRef,
}: {
  delegateFragmentRef: ActionButtonVoteButtonDelegateFragment$key | undefined;
  fragmentRef: ActionButtonFragment$key;
}) {
  const auction = useFragment(
    graphql`
      fragment ActionButtonFragment on PropHouseAuction {
        number
        title

        startTime
        proposalEndTime
        votingEndTime

        ...ActionButtonVoteButtonAuctionFragment
      }
    `,
    fragmentRef
  );

  const currentTime = new Date();
  const startTime = new Date(auction.startTime);
  const proposalEndTime = new Date(auction.proposalEndTime);
  const votingEndTime = new Date(auction.votingEndTime);

  return (
    <VStack
      className={css`
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};
      `}
    >
      {(() => {
        if (currentTime < startTime) {
          return (
            <DisabledVoteButton reason={`Proposal period has not started`} />
          );
        }

        if (currentTime < proposalEndTime) {
          return (
            <button
              className={voteButtonStyles}
              onClick={() => {
                window.open(
                  `https://prop.house/nouns/${nameToSlug(auction.title)}`,
                  "_blank"
                );
              }}
            >
              Submit a Proposal
            </button>
          );
        }

        if (currentTime >= votingEndTime) {
          return <DisabledVoteButton reason={`Voting period has ended`} />;
        }

        if (!delegateFragmentRef) {
          return <DisabledVoteButton reason={`Connect wallet to vote`} />;
        }

        return (
          <AuctionVoteButton
            auctionFragmentRef={auction}
            delegateFragmentRef={delegateFragmentRef}
          />
        );
      })()}
    </VStack>
  );
}

function AuctionVoteButton({
  auctionFragmentRef,
  delegateFragmentRef,
}: {
  auctionFragmentRef: ActionButtonVoteButtonAuctionFragment$key;
  delegateFragmentRef: ActionButtonVoteButtonDelegateFragment$key;
}) {
  const auction = useFragment(
    graphql`
      fragment ActionButtonVoteButtonAuctionFragment on PropHouseAuction {
        number

        ...usePropHouseAvailableVotingPowerAuctionFragment
      }
    `,
    auctionFragmentRef
  );

  const delegate = useFragment(
    graphql`
      fragment ActionButtonVoteButtonDelegateFragment on Delegate {
        address {
          resolvedName {
            address
          }
        }

        ...usePropHouseAvailableVotingPowerFragmentDelegateFragment
      }
    `,
    delegateFragmentRef
  );

  const pendingVotes = usePendingVotes();

  const pendingVotesCount = Array.from(pendingVotes.values()).reduce(
    (it, acc) => it + acc,
    0
  );

  const { votingPower, votingAddresses } = usePropHouseAvailableVotingPower(
    delegate,
    auction
  );

  const openDialog = useOpenDialog();

  const castVotes = useCallback(
    () =>
      openDialog({
        type: "CAST_AUCTION_VOTE",
        params: {
          address: delegate.address.resolvedName.address,
          auctionId: auction.number,
          pendingVotes: pendingVotes,
          votingPower,
          votingAddresses,
        },
      }),
    [
      auction.number,
      delegate.address.resolvedName.address,
      openDialog,
      pendingVotes,
      votingAddresses,
      votingPower,
    ]
  );

  const availableVotingPower = votingPower.reduce(
    (acc, it) => acc + it.availableVotingPower,
    0
  );

  const votingPowerSum = Math.max(availableVotingPower - pendingVotesCount, 0);

  if (!availableVotingPower) {
    return <DisabledVoteButton reason={"No Eligible Votes"} />;
  }

  if (!pendingVotesCount) {
    return (
      <DisabledVoteButton reason={`Cast votes (${votingPowerSum} left)`} />
    );
  }

  if (pendingVotesCount > availableVotingPower) {
    return (
      <DisabledVoteButton
        reason={`Not enough voting power (${
          pendingVotesCount - availableVotingPower
        } too many votes)`}
      />
    );
  }

  return (
    <button className={voteButtonStyles} onClick={() => castVotes()}>
      Cast votes ({votingPowerSum} left)
    </button>
  );
}

// Taken from https://github.com/Prop-House/prop-house-monorepo/blob/f978e06a9d2198b9f2891117ee5b001051858dbd/packages/prop-house-webapp/src/utils/communitySlugs.ts#L1
const nameToSlug = (name: string) => name.replaceAll(" ", "-").toLowerCase();

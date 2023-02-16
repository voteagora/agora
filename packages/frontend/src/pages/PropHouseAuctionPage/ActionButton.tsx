import { useTotalVotingPower } from "./propHouse";
import graphql from "babel-plugin-relay/macro";
import { useStartTransition } from "../../components/HammockRouter/HammockRouter";
import { useOpenDialog } from "../../components/DialogProvider/DialogProvider";
import { VStack } from "../../components/VStack";
import * as theme from "../../theme";
import {
  DisabledVoteButton,
  voteButtonStyles,
} from "../ProposalsPage/CastVoteInput";
import { COMMUNITY_ADDRESS } from "./PropHouseAuctionPage";
import { useAccount } from "wagmi";
import { css } from "@emotion/css";
import { useFragment } from "react-relay";
import { ActionButtonFragment$key } from "./__generated__/ActionButtonFragment.graphql";

export function ActionButton({
  fragmentRef,
  pendingVotes,
}: {
  fragmentRef: ActionButtonFragment$key;
  pendingVotes: Record<number, number>;
}) {
  const auction = useFragment(
    graphql`
      fragment ActionButtonFragment on PropHouseAuction {
        number
        title

        startTime
        proposalEndTime
        votingEndTime

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
    fragmentRef
  );

  const currentTime = new Date();
  const startTime = new Date(auction.startTime);
  const proposalEndTime = new Date(auction.proposalEndTime);
  const votingEndTime = new Date(auction.votingEndTime);
  const { address } = useAccount();

  const startTransition = useStartTransition();
  const openDialog = useOpenDialog();

  const totalVotingPower = useTotalVotingPower({
    auctionId: auction.number.toString(),
    address: address,
    communityAddress: COMMUNITY_ADDRESS,
  });

  const addressVotes = auction.votes
    .filter(
      (it) =>
        address &&
        it.address?.resolvedName?.address?.toLowerCase() ===
          address.toLowerCase()
    )
    .reduce((acc, it) => acc + it.weight, 0);

  const pendingVotesCount = Object.values(pendingVotes).reduce(
    (it, acc) => it + acc,
    0
  );

  const availableVotingPower = Math.max(totalVotingPower - addressVotes, 0);

  const votingPower = Math.max(availableVotingPower - pendingVotesCount, 0);

  const castVotes = (address: string) => {
    startTransition(() => {
      openDialog({
        type: "CAST_AUCTION_VOTE",
        params: {
          address,
          auctionId: auction.number,
          pendingVotes: pendingVotes,
        },
      });
    });
  };

  const { onClick, buttonText }: { onClick?: () => void; buttonText?: string } =
    (() => {
      if (currentTime < startTime) {
        return {
          buttonText: "Proposal period has not started",
        };
      }

      if (currentTime < proposalEndTime) {
        return {
          // TODO: Don't hard-code nouns here
          onClick: () =>
            window.open(
              `https://prop.house/nouns/${nameToSlug(auction.title)}`,
              "_blank"
            ),
          buttonText: "Submit a Proposal",
        };
      }

      if (currentTime >= votingEndTime) {
        return {
          buttonText: "Voting period has ended",
        };
      }

      if (!address) {
        return {
          buttonText: "Connect wallet to vote",
        };
      }

      if (!availableVotingPower) {
        return {
          buttonText: "No Eligible Votes",
        };
      }

      if (!pendingVotesCount) {
        return {
          buttonText: `Cast votes (${votingPower} left)`,
        };
      }

      if (pendingVotesCount > availableVotingPower) {
        return {
          buttonText: `Not enough voting power (${
            pendingVotesCount - availableVotingPower
          } too many votes)`,
        };
      }

      return {
        onClick: () => castVotes(address),
        buttonText: `Cast votes (${votingPower} left)`,
      };
    })();

  return (
    <VStack
      className={css`
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};
      `}
    >
      {onClick && (
        <button
          onClick={onClick}
          className={css`
            ${voteButtonStyles}
          `}
        >
          {buttonText}
        </button>
      )}

      {!onClick && <DisabledVoteButton reason={buttonText} />}
    </VStack>
  );
}

// Taken from https://github.com/Prop-House/prop-house-monorepo/blob/f978e06a9d2198b9f2891117ee5b001051858dbd/packages/prop-house-webapp/src/utils/communitySlugs.ts#L1
const nameToSlug = (name: string) => name.replaceAll(" ", "-").toLowerCase();

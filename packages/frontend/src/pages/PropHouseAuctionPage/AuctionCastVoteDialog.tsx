import { useProvider } from "wagmi";
import graphql from "babel-plugin-relay/macro";
import { HStack, VStack } from "../../components/VStack";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import { colorForSupportType } from "../DelegatePage/VoteDetailsContainer";
import { voteButtonStyles } from "../ProposalsPage/CastVoteInput";
import { useLazyLoadQuery } from "react-relay/hooks";
import { AuctionCastVoteDialogQuery } from "./__generated__/AuctionCastVoteDialogQuery.graphql";
import { compareBy, flipComparator } from "../../utils/sorting";
import { NounResolvedName } from "../../components/NounResolvedName";
import {
  AvailableVotingPower,
  VotingAddress,
} from "./usePropHouseAvailableVotingPower";
import { submitVotes } from "./submitVotes";

export function AuctionCastVoteDialog({
  address,
  auctionId,
  pendingVotes,
  closeDialog,
  votingPower,
  votingAddresses,
}: {
  address: string;
  auctionId: number;
  pendingVotes: Map<number, number>;
  closeDialog: () => void;
  votingPower: AvailableVotingPower[];
  votingAddresses: VotingAddress[];
}) {
  const {
    propHouseAuction: auction,
    delegate: { address: resolvedAddress },
  } = useLazyLoadQuery<AuctionCastVoteDialogQuery>(
    graphql`
      query AuctionCastVoteDialogQuery($auctionId: String!, $address: String!) {
        delegate(addressOrEnsName: $address) {
          address {
            resolvedName {
              ...NounResolvedNameFragment
            }
          }
        }

        propHouseAuction(auctionId: $auctionId) {
          proposals {
            number
            title
          }
        }
      }
    `,
    {
      auctionId: auctionId.toString(),
      address,
    }
  );

  const totalVotes = Array.from(pendingVotes.values()).reduce(
    (res, a) => res + a,
    0
  );

  const provider = useProvider();

  // todo: loading state
  const onClick = async () => {
    await submitVotes(pendingVotes, votingPower, votingAddresses, provider);
    closeDialog();
  };

  return (
    <VStack
      alignItems="center"
      className={css`
        padding: ${theme.spacing["8"]};
      `}
    >
      <Dialog.Panel
        as={motion.div}
        initial={{
          scale: 0.9,
          translateY: theme.spacing["8"],
        }}
        animate={{ translateY: 0, scale: 1 }}
        className={css`
          width: 100%;
          max-width: ${theme.maxWidth.xs};
          background: ${theme.colors.white};
          border-radius: ${theme.spacing["3"]};
          padding: ${theme.spacing["6"]};
          font-size: ${theme.fontSize.xs};
        `}
      >
        <VStack gap="2">
          <HStack
            justifyContent="space-between"
            className={css`
              font-weight: ${theme.fontWeight.semibold};
            `}
          >
            <HStack gap="2">
              <NounResolvedName resolvedName={resolvedAddress.resolvedName} />

              <div
                className={css`
                  color: ${colorForSupportType("FOR")};
                `}
              >
                voting
              </div>
            </HStack>
            <div
              className={css`
                color: ${theme.colors.gray[700]};
              `}
            >
              {totalVotes} votes
            </div>
          </HStack>

          <VStack
            gap="0"
            className={css`
              font-weight: ${theme.fontWeight.medium};
              line-height: ${theme.lineHeight["3"]};
            `}
          >
            {Array.from(pendingVotes.entries())
              .sort(flipComparator(compareBy(([_, it]) => it)))
              .map(([proposalId, voteCount]) => {
                const proposal = auction.proposals.find(
                  (p) => p.number === proposalId
                )!;

                return (
                  <div key={proposalId}>
                    {voteCount} votes for {proposal.title}
                  </div>
                );
              })}
          </VStack>

          <VStack>
            <button
              onClick={onClick}
              className={css`
                ${voteButtonStyles};
                font-weight: ${theme.fontWeight.semibold};
                font-size: ${theme.fontSize.base};
                height: ${theme.spacing["12"]};
              `}
            >
              Vote
            </button>
          </VStack>
        </VStack>
      </Dialog.Panel>
    </VStack>
  );
}

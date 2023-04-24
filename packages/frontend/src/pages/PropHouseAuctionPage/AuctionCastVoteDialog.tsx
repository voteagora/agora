import { useProvider, useSigner } from "wagmi";
import { graphql } from "react-relay";
import { css } from "@emotion/css";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import { useLazyLoadQuery } from "react-relay/hooks";

import { colorForSupportType } from "../DelegatePage/VoteDetailsContainer";
import { voteButtonStyles } from "../ProposalsPage/CastVoteInput";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { compareBy, flipComparator } from "../../utils/sorting";
import { NounResolvedName } from "../../components/NounResolvedName";
import { CastAuctionVoteDialogType } from "../../components/DialogProvider/dialogs";
import { DialogProps } from "../../components/DialogProvider/types";

import { AuctionCastVoteDialogQuery } from "./__generated__/AuctionCastVoteDialogQuery.graphql";
import { submitVotes } from "./submitVotes";

export default function AuctionCastVoteDialog({
  address,
  auctionId,
  pendingVotes,
  closeDialog,
  votingPower,
  votingAddresses,
}: DialogProps<CastAuctionVoteDialogType>) {
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
  const { data: signer } = useSigner();

  // todo: loading state
  const onClick = async () => {
    if (!signer) {
      return;
    }

    await submitVotes(
      pendingVotes,
      votingPower,
      votingAddresses,
      provider,
      signer as any
    );
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

import { useProvider, useSigner } from "wagmi";
import graphql from "babel-plugin-relay/macro";
import { useState } from "react";
import { HStack, VStack } from "../../components/VStack";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import { colorForSupportType } from "../DelegatePage/VoteDetailsContainer";
import { voteButtonStyles } from "../ProposalsPage/CastVoteInput";
import { ethers, TypedDataField } from "ethers";
import { fetchBlockNumber } from "@wagmi/core";
import { TypedDataSigner } from "@ethersproject/abstract-signer";
import { COMMUNITY_ADDRESS } from "./PropHouseAuctionPage";
import { basePath } from "./propHouse";
import { useLazyLoadQuery } from "react-relay/hooks";
import { AuctionCastVoteDialogQuery } from "./__generated__/AuctionCastVoteDialogQuery.graphql";
import { compareBy, flipComparator } from "../../utils/sorting";
import { NounResolvedName } from "../../components/NounResolvedName";

const DomainSeparator = {
  name: "Prop House",
};

const VoteMessageTypes: Record<string, TypedDataField[]> = {
  Votes: [{ name: "votes", type: "Vote[]" }],
  Vote: [
    { name: "direction", type: "uint256" },
    { name: "proposalId", type: "uint256" },
    { name: "weight", type: "uint256" },
    { name: "communityAddress", type: "address" },
    { name: "blockHeight", type: "uint256" },
  ],
};

export function AuctionCastVoteDialog({
  address,
  auctionId,
  pendingVotes,
  closeDialog,
}: {
  address: string;
  auctionId: number;
  pendingVotes: Record<number, number>;
  closeDialog: () => void;
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

  const provider = useProvider();
  const { data: signer } = useSigner();
  const [messageOverride, setMessageOverride] = useState<string | null>(null);

  const onClick = async () => {
    const errorMessage = await submitVotes(
      pendingVotes,
      provider,
      address!,
      signer!
    );

    setMessageOverride(
      errorMessage ? `Error: ${errorMessage}` : "Votes submitted!"
    );
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
              {Object.values(pendingVotes).reduce((res, a) => res + a, 0)} votes
            </div>
          </HStack>

          <VStack
            gap="0"
            className={css`
              font-weight: ${theme.fontWeight.medium};
              line-height: ${theme.lineHeight["3"]};
            `}
          >
            {messageOverride ??
              Object.entries(pendingVotes)
                .sort(flipComparator(compareBy(([_, it]) => it)))
                .map(([proposalId, voteCount]) => {
                  const proposal = auction.proposals.find(
                    (p) => p.number === parseInt(proposalId)
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
              onClick={messageOverride ? closeDialog : onClick}
              className={css`
                ${voteButtonStyles};
                font-weight: ${theme.fontWeight.semibold};
                font-size: ${theme.fontSize.base};
                height: ${theme.spacing["12"]};
              `}
            >
              {messageOverride ? "Done" : "Vote"}
            </button>
          </VStack>
        </VStack>
      </Dialog.Panel>
    </VStack>
  );
}

async function submitVotes(
  pendingVotes: Record<number, number>,
  provider: ethers.providers.Provider,
  address: string,
  signer: ethers.Signer
) {
  // https://github.com/Prop-House/prop-house-monorepo/blob/564dfcc705fa69cb89ed76dd53bda109e3948fca/packages/prop-house-backend/src/vote/votes.controller.ts#L54
  // Submit each proposal's vote separately
  // The signature is first generated for the entire vote block.

  const blockNumber = await fetchBlockNumber();
  const payload = {
    votes: Object.entries(pendingVotes).map(([proposalId, voteCount]) => {
      return {
        direction: 1,
        proposalId: parseInt(proposalId),
        weight: voteCount,
        communityAddress: COMMUNITY_ADDRESS,
        blockHeight: blockNumber,
      };
    }),
  };

  const code = await provider.getCode(address);
  const isContract = code !== "0x";

  let signature = "0x";
  if (!isContract) {
    const typedSigner = signer as ethers.Signer & TypedDataSigner;
    signature = await typedSigner._signTypedData(
      DomainSeparator,
      VoteMessageTypes,
      payload
    );
  }

  for (const vote of payload.votes) {
    const signedPayload = {
      signedData: {
        message: Buffer.from(JSON.stringify(payload)).toString("base64"),
        signature,
        signer: ethers.utils.getAddress(address),
      },
      address: ethers.utils.getAddress(address),
      messageTypes: VoteMessageTypes,
      domainSeparator: DomainSeparator,
      ...vote,
    };

    const response = await fetch(new URL(`votes`, basePath).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signedPayload),
    });
    if (!response.ok) {
      return (await response.json())["message"];
    }
  }

  return null;
}

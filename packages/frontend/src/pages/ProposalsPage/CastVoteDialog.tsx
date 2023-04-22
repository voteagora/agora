import { useFragment, useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { NounGridChildren } from "../../components/NounGrid";
import { UserIcon } from "@heroicons/react/20/solid";
import { css } from "@emotion/css";
import { motion } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { NounsDAOLogicV2 } from "../../contracts/generated";
import { ReactNode } from "react";
import {
  colorForSupportType,
  SupportTextProps,
} from "../DelegatePage/VoteDetailsContainer";
import { CastVoteDialogQuery } from "./__generated__/CastVoteDialogQuery.graphql";
import { useContractWrite } from "../../hooks/useContractWrite";
import { nounsAlligator, nounsDao } from "../../contracts/contracts";
import { CastVoteDialogTokenDelegationLotVoteCellFragment$key } from "./__generated__/CastVoteDialogTokenDelegationLotVoteCellFragment.graphql";
import { CastVoteDialogLiquidDelegationLotVoteCellFragment$key } from "./__generated__/CastVoteDialogLiquidDelegationLotVoteCellFragment.graphql";
import { Alligator } from "../../contracts/generated/Alligator";

type Props = {
  proposalId: number;
  address: string;
  reason: string;
  supportType: SupportTextProps["supportType"];
  closeDialog: () => void;
};

export function CastVoteDialog(props: Props) {
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
        `}
      >
        <CastVoteDialogContents {...props} />
      </Dialog.Panel>
    </VStack>
  );
}

function CastVoteDialogContents({
  proposalId,
  address,
  reason,
  supportType,
  closeDialog,
}: Props) {
  const proposalIdRaw = proposalId.toString();

  const { delegate } = useLazyLoadQuery<CastVoteDialogQuery>(
    graphql`
      query CastVoteDialogQuery(
        $accountAddress: String!
        $support: SupportType!
        $proposalId: ID!
      ) {
        delegate(addressOrEnsName: $accountAddress) {
          address {
            resolvedName {
              ...NounResolvedLinkFragment
            }
          }

          delegateSnapshot(proposalId: $proposalId) {
            nounsRepresented {
              __typename
            }
          }

          liquidRepresentation(
            filter: {
              currentlyActive: true
              canVote: true
              forProposal: { proposalId: $proposalId, support: $support }
            }
          ) {
            proxy {
              delegateSnapshot(proposalId: $proposalId) {
                nounsRepresented {
                  __typename
                }
              }
            }
          }

          ...CastVoteDialogTokenDelegationLotVoteCellFragment
            @arguments(proposalId: $proposalId)

          ...CastVoteDialogLiquidDelegationLotVoteCellFragment
            @arguments(support: $support, proposalId: $proposalId)
        }
      }
    `,
    {
      accountAddress: address,
      support: supportType,
      proposalId: proposalIdRaw,
    }
  );

  const totalVotes =
    delegate.delegateSnapshot.nounsRepresented.length +
    delegate.liquidRepresentation.flatMap(
      (it) => it.proxy.delegateSnapshot.nounsRepresented
    ).length;

  const supportTypeRaw = ["AGAINST", "FOR", "ABSTAIN"].indexOf(supportType);

  return (
    <VStack
      gap="6"
      className={css`
        font-size: ${theme.fontSize["xs"]};
      `}
    >
      {/* TODO: Spaghetti code copied from VotesCastPanel */}
      <VStack gap="2">
        <HStack
          justifyContent="space-between"
          className={css`
            font-weight: ${theme.fontWeight.semibold};
            line-height: ${theme.lineHeight.none};
          `}
        >
          <HStack
            className={css`
              color: ${theme.colors.black};
            `}
          >
            <NounResolvedLink resolvedName={delegate.address.resolvedName} />

            <div
              className={css`
                color: ${colorForSupportType(supportType)};
              `}
            >
              &nbsp;voting {supportType.toLowerCase()}
            </div>
          </HStack>
          <HStack
            className={css`
              color: #66676b;
            `}
          >
            <div>{totalVotes}</div>

            <div
              className={css`
                width: ${theme.spacing["4"]};
                height: ${theme.spacing["4"]};
              `}
            >
              <UserIcon />
            </div>
          </HStack>
        </HStack>
        <div
          className={css`
            color: ${theme.colors.gray["4f"]};
          `}
        >
          {reason ? reason : "No reason provided"}
        </div>
      </VStack>

      <VStack
        className={css`
          border-radius: ${theme.spacing["2"]};
          border: 1px solid ${theme.colors.gray.eb};
        `}
      >
        <TokenDelegationLotVoteCell
          closeDialog={closeDialog}
          supportType={supportTypeRaw}
          proposalId={proposalIdRaw}
          reason={reason}
          fragment={delegate}
        />

        <LiquidDelegationLotVoteCell
          reason={reason}
          proposalId={proposalIdRaw}
          supportType={supportTypeRaw}
          closeDialog={closeDialog}
          fragment={delegate}
        />
      </VStack>
    </VStack>
  );
}

function LiquidDelegationLotVoteCell({
  proposalId,
  supportType,
  reason,
  closeDialog,
  fragment,
}: {
  proposalId: string;
  supportType: number;
  reason: string;
  closeDialog: () => void;
  fragment: CastVoteDialogLiquidDelegationLotVoteCellFragment$key;
}) {
  const { liquidRepresentation } = useFragment(
    graphql`
      fragment CastVoteDialogLiquidDelegationLotVoteCellFragment on Delegate
      @argumentDefinitions(
        support: { type: "SupportType!" }
        proposalId: { type: "ID!" }
      ) {
        liquidRepresentation(
          filter: {
            currentlyActive: true
            canVote: true
            forProposal: { proposalId: $proposalId, support: $support }
          }
        ) {
          lots {
            authorityChain
          }

          proxy {
            proposalVote(proposalId: $proposalId) {
              __typename
            }

            delegateSnapshot(proposalId: $proposalId) {
              nounsRepresented {
                # eslint-disable-next-line relay/unused-fields
                id
                # eslint-disable-next-line relay/must-colocate-fragment-spreads
                ...NounImageFragment
              }
            }
          }
        }
      }
    `,
    fragment
  );

  const lots = liquidRepresentation.flatMap((lot) => {
    if (!lot.proxy.delegateSnapshot.nounsRepresented.length) {
      return [];
    }

    if (lot.proxy.proposalVote) {
      return [];
    }

    return [
      {
        proxy: lot.proxy,
        lot: lot.lots[0],
      },
    ];
  });

  const writeLiquid = useContractWrite<
    Alligator,
    "castRefundableVotesWithReasonBatched"
  >(
    nounsAlligator,
    "castRefundableVotesWithReasonBatched",
    [
      lots.map((lot) => lot.lot.authorityChain.slice()),
      proposalId,
      supportType,
      reason,
    ],
    () => closeDialog()
  );

  const nouns = lots.flatMap(
    (lot) => lot.proxy.delegateSnapshot.nounsRepresented
  );

  if (!lots.length) {
    return null;
  }

  return (
    <HStack
      className={css`
        padding: ${theme.spacing["4"]};
      `}
      justifyContent="space-between"
      alignItems="center"
    >
      <HStack alignItems="center">
        <NounGridChildren
          liquidRepresentation={[]}
          totalNouns={nouns.length}
          count={4}
          nouns={nouns}
          imageSize="8"
          overflowFontSize="xs"
        />
      </HStack>

      <VoteButton onClick={() => writeLiquid()}>Vote</VoteButton>
    </HStack>
  );
}

function TokenDelegationLotVoteCell({
  closeDialog,
  proposalId,
  supportType,
  reason,
  fragment,
}: {
  proposalId: string;
  supportType: number;
  reason: string;
  closeDialog: () => void;
  fragment: CastVoteDialogTokenDelegationLotVoteCellFragment$key;
}) {
  const delegate = useFragment(
    graphql`
      fragment CastVoteDialogTokenDelegationLotVoteCellFragment on Delegate
      @argumentDefinitions(proposalId: { type: "ID!" }) {
        delegateSnapshot(proposalId: $proposalId) {
          nounsRepresented {
            # eslint-disable-next-line relay/unused-fields
            id
            # eslint-disable-next-line relay/must-colocate-fragment-spreads
            ...NounImageFragment
          }
        }
      }
    `,
    fragment
  );

  const writeTokenVote = useContractWrite<
    NounsDAOLogicV2,
    "castRefundableVoteWithReason"
  >(
    nounsDao,
    "castRefundableVoteWithReason",
    [proposalId, supportType, reason],
    () => closeDialog()
  );

  // todo: casting from the same proxy multiple times isn't blocked in the ui
  if (!delegate.delegateSnapshot.nounsRepresented.length) {
    // todo: handle this at a higher level so the dialog means something
    return null;
  }

  return (
    <HStack
      className={css`
        padding: ${theme.spacing["4"]};
      `}
      justifyContent="space-between"
      alignItems="center"
    >
      <HStack alignItems="center">
        {/* TODO: These don't overlap like in the design */}
        <NounGridChildren
          nouns={delegate.delegateSnapshot.nounsRepresented}
          liquidRepresentation={[]}
          count={4}
          imageSize="8"
          overflowFontSize="xs"
        />
      </HStack>

      {/* TODO: There are a lot of reasons why write is unavailable. We've captured
        most of them by disable the vote buttons in the VotesCastPanel, so we're assuming
        the user already voted if write is unavailable */}
      {/* TODO: Make it obvious that the user already voted. Right now the button is just disabled
        Haven't done-so yet because the text "Already Voted" makes the button look ugly*/}
      <VoteButton onClick={() => writeTokenVote()}>Vote</VoteButton>
    </HStack>
  );
}

const VoteButton = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={css`
        text-align: center;
        border-radius: ${theme.spacing["2"]};
        border: 1px solid ${theme.colors.gray.eb};
        font-weight: ${theme.fontWeight.semibold};
        font-size: ${theme.fontSize.xs};
        color: ${theme.colors.black};
        padding: ${theme.spacing["2"]} ${theme.spacing["6"]};
        cursor: pointer;

        ${!onClick &&
        css`
          background: ${theme.colors.gray.eb};
          color: ${theme.colors.gray["700"]};
          cursor: not-allowed;
        `}

        :hover {
          background: ${theme.colors.gray.eb};
        }
      `}
    >
      {children}
    </div>
  );
};

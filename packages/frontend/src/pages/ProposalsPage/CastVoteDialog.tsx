import { useFragment, useLazyLoadQuery } from "react-relay/hooks";
import { graphql } from "react-relay";
import { UserIcon } from "@heroicons/react/20/solid";
import { css } from "@emotion/css";
import { motion } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { Address } from "@wagmi/core";
import { BigNumber } from "ethers";
import { useEnsAvatar } from "wagmi";

import { contracts } from "../../utils/contracts";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { NounGridChildren } from "../../components/NounGrid";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { colorForSupportType } from "../DelegatePage/VoteDetailsContainer";
import { useContractWrite } from "../../hooks/useContractWrite";
import { CastVoteDialogType } from "../../components/DialogProvider/dialogs";
import { DialogProps } from "../../components/DialogProvider/types";
import { icons } from "../../icons/icons";

import { CastVoteDialogQuery } from "./__generated__/CastVoteDialogQuery.graphql";
import { CastVoteDialogTokenDelegationLotVoteCellFragment$key } from "./__generated__/CastVoteDialogTokenDelegationLotVoteCellFragment.graphql";
import { CastVoteDialogLiquidDelegationLotVoteCellFragment$key } from "./__generated__/CastVoteDialogLiquidDelegationLotVoteCellFragment.graphql";
import { CastVoteLayout } from "./CastVoteLayout";

type Props = DialogProps<CastVoteDialogType>;
export default function CastVoteDialog(props: Props) {
  return (
    <VStack
      alignItems="center"
      className={css`
        padding: ${theme.spacing["4"]};
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
          max-width: ${theme.maxWidth.sm};
          background: ${theme.colors.white};
          border-radius: ${theme.spacing["3"]};
          border: 1px solid ${theme.colors.gray[300]};
          box-shadow: ${theme.boxShadow.newDefault};
          padding: ${theme.spacing["4"]};
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
  onVoteSuccess,
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
              address
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

  const avatar = useEnsAvatar({
    address: delegate.address.resolvedName.address as any,
  });
  return (
    <VStack
      gap="4"
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
          alignItems="center"
        >
          <HStack
            className={css`
              color: ${theme.colors.black};
            `}
            alignItems="center"
          >
            <HStack gap="2" alignItems="center">
              <img
                className={css`
                  width: 24px;
                  height: 24px;
                  border-radius: ${theme.borderRadius.md};
                `}
                src={avatar.data || icons.anonNoun}
                alt={"anon noun"}
              />
              <NounResolvedLink resolvedName={delegate.address.resolvedName} />
            </HStack>
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
            alignItems="center"
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
            color: ${theme.colors.gray[700]};
            margin-top: ${theme.spacing["1"]};
          `}
        >
          {reason ? (
            <div
              className={css`
                white-space: pre-wrap;
              `}
            >
              {reason}
            </div>
          ) : (
            "No reason provided"
          )}
        </div>
      </VStack>

      <VStack
        className={css`
          border-radius: ${theme.spacing["2"]};
          border: 1px solid ${theme.colors.gray.eb};
        `}
      >
        <TokenDelegationLotVoteCell
          supportType={supportTypeRaw}
          proposalId={proposalIdRaw}
          reason={reason}
          fragment={delegate}
          onVoteSuccess={onVoteSuccess}
        />

        <LiquidDelegationLotVoteCell
          reason={reason}
          proposalId={proposalIdRaw}
          supportType={supportTypeRaw}
          fragment={delegate}
          onVoteSuccess={onVoteSuccess}
        />
      </VStack>
    </VStack>
  );
}

function LiquidDelegationLotVoteCell({
  proposalId,
  supportType,
  reason,
  fragment,
  onVoteSuccess,
}: {
  proposalId: string;
  supportType: number;
  reason: string;
  fragment: CastVoteDialogLiquidDelegationLotVoteCellFragment$key;
  onVoteSuccess: () => void;
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

  const { write, isLoading, isError, isSuccess, canExecute, txHash } =
    useContractWrite(
      contracts.nounsAlligator,
      "castRefundableVotesWithReasonBatched",
      [
        lots.map((lot) => lot.lot.authorityChain.map((it) => it as Address)),
        BigNumber.from(proposalId),
        supportType,
        reason,
      ],
      () => {
        onVoteSuccess();
      }
    );

  const nouns = lots.flatMap(
    (lot) => lot.proxy.delegateSnapshot.nounsRepresented
  );

  if (!lots.length) {
    return null;
  }

  return (
    <CastVoteLayout
      isError={isError}
      isSuccess={isSuccess}
      isLoading={isLoading}
      canExecute={canExecute}
      txHash={txHash}
      write={write}
    >
      <NounGridChildren
        totalNouns={nouns.length}
        liquidRepresentation={[]}
        nouns={nouns}
        count={4}
        imageSize="8"
        overflowFontSize="xs"
      />
    </CastVoteLayout>
  );
}

function TokenDelegationLotVoteCell({
  proposalId,
  supportType,
  reason,
  fragment,
  onVoteSuccess,
}: {
  proposalId: string;
  supportType: number;
  reason: string;
  fragment: CastVoteDialogTokenDelegationLotVoteCellFragment$key;
  onVoteSuccess: () => void;
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

  const { write, isLoading, isError, isSuccess, canExecute, txHash } =
    useContractWrite(
      contracts.nounsDao,
      "castRefundableVoteWithReason",
      [BigNumber.from(proposalId), supportType, reason],
      () => {
        onVoteSuccess();
      }
    );

  const lots = delegate.liquidRepresentation.flatMap((lot) => {
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

  // if no liquid and normal votes, allow normal votes with no power to indicate reason
  if (!lots.length && !delegate.delegateSnapshot.nounsRepresented.length) {
    // todo: handle this at a higher level so the dialog means something
    return (
      <CastVoteLayout
        isError={isError}
        isSuccess={isSuccess}
        isLoading={isLoading}
        canExecute={canExecute}
        txHash={txHash}
        write={write}
      >
        <div
          className={css`
            color: ${theme.colors.gray["700"]};
          `}
        >
          You have no votes at this prop, but can still vote to express your
          view onchain.
        </div>
      </CastVoteLayout>
    );
  }
  // if has liquid votes but no normal votes, then do not allow normal votes
  else if (!delegate.delegateSnapshot.nounsRepresented.length) {
    return null;
  }
  // if has normal votes, allow normal voting
  return (
    <CastVoteLayout
      isError={isError}
      isSuccess={isSuccess}
      isLoading={isLoading}
      canExecute={canExecute}
      write={write}
      txHash={txHash}
    >
      {/* TODO: These don't overlap like in the design */}
      <NounGridChildren
        liquidRepresentation={[]}
        nouns={delegate.delegateSnapshot.nounsRepresented}
        count={4}
        imageSize="8"
        overflowFontSize="xs"
      />
    </CastVoteLayout>
  );
}

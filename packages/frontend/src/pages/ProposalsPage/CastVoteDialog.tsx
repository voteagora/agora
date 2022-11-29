import * as Sentry from "@sentry/react";
import { useFragment } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { inset0 } from "../../theme";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { NounGridChildren } from "../../components/NounGrid";
import { useContractWrite, usePrepareContractWrite } from "wagmi";
import { UserIcon } from "@heroicons/react/20/solid";
import { css } from "@emotion/css";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { CastVoteDialogFragment$key } from "./__generated__/CastVoteDialogFragment.graphql";
import { NounGridFragment$data } from "../../components/__generated__/NounGridFragment.graphql";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { NounsDaoLogicV1__factory } from "../../contracts/generated";
import { ReactNode } from "react";
import {
  colorForSupportType,
  SupportTextProps,
} from "../DelegatePage/VoteDetailsContainer";

// TODO: Better rendering for users with no voting power
export function CastVoteDialog({
  fragmentRef,
  proposalID,
  reason,
  supportType,
  closeDialog,
  completeVote,
}: {
  fragmentRef: CastVoteDialogFragment$key | null;
  proposalID: number;
  reason: string;
  supportType: SupportTextProps["supportType"] | null;
  closeDialog: () => void;
  completeVote: () => void;
}) {
  const isOpen = supportType != null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className={css`
              z-index: 10;
              background: black;
              position: fixed;
              ${inset0};
            `}
          />
        )}
      </AnimatePresence>

      <Dialog
        open={isOpen}
        onClose={closeDialog}
        className={css`
          z-index: 10;
          position: fixed;
          ${inset0};

          display: flex;
          flex-direction: column;
          align-content: stretch;
          justify-content: center;
        `}
      >
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
            {supportType && (
              <CastVoteDialogContents
                fragmentRef={fragmentRef}
                proposalID={proposalID}
                completeVote={completeVote}
                supportType={supportType}
                reason={reason}
              />
            )}
          </Dialog.Panel>
        </VStack>
      </Dialog>
    </>
  );
}

function CastVoteDialogContents({
  fragmentRef,
  proposalID,
  completeVote,
  supportType,
  reason,
}: {
  fragmentRef: CastVoteDialogFragment$key | null;
  proposalID: number;
  reason: string;
  supportType: SupportTextProps["supportType"];
  completeVote: () => void;
}) {
  // Ideal flow (not implemented yet):
  // 1. Check that user doesn't have a delegate
  // 2. Check that user has >0 Nouns
  // 3. Check that user has not already voted
  // Notes:
  // If user has no nouns, fields are null
  const address = useFragment<CastVoteDialogFragment$key>(
    graphql`
      fragment CastVoteDialogFragment on Address {
        wrappedDelegate {
          address {
            resolvedName {
              ...NounResolvedLinkFragment
            }
          }

          delegate {
            delegatedVotesRaw
            nounsRepresented {
              id
              ...NounImageFragment
            }
          }
        }
      }
    `,
    fragmentRef
  );

  const { config } = usePrepareContractWrite({
    addressOrName: "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d",
    contractInterface: NounsDaoLogicV1__factory.createInterface(),
    functionName: "castVoteWithReason",
    args: [
      proposalID,
      ["AGAINST", "FOR", "ABSTAIN"].indexOf(supportType),
      reason,
    ],
    onError(e) {
      // TODO: How much do I have to handle exceptions?
      Sentry.captureException(e);
    },
  });

  const { write } = useContractWrite({
    ...config,
    onSuccess() {
      completeVote();
    },
  });

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
            gap="0"
            className={css`
              color: ${theme.colors.black};
            `}
          >
            {address?.wrappedDelegate.address.resolvedName ? (
              <NounResolvedLink
                resolvedName={address?.wrappedDelegate.address.resolvedName}
              />
            ) : (
              "anonymous"
            )}
            <div
              className={css`
                color: ${colorForSupportType(supportType)};
              `}
            >
              &nbsp;voting {supportType.toLowerCase()}
            </div>
          </HStack>
          <HStack
            gap="0"
            className={css`
              color: #66676b;
            `}
          >
            <div>
              {address?.wrappedDelegate.delegate?.delegatedVotesRaw ?? "0"}
            </div>
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
      <HStack
        className={css`
          width: 100%;
          z-index: 1;
          position: relative;
          padding: ${theme.spacing["4"]};
          border-radius: ${theme.spacing["2"]};
          border: 1px solid ${theme.colors.gray.eb};
        `}
        justifyContent="space-between"
        alignItems="center"
      >
        <NounsDisplay
          totalNouns={Number(
            address?.wrappedDelegate.delegate?.delegatedVotesRaw ?? "0"
          )}
          nouns={address?.wrappedDelegate.delegate?.nounsRepresented ?? []}
        />
        {/* TODO: There are a lot of reasons why write is unavailable. We've captured
        most of them by disable the vote buttons in the VotesCastPanel, so we're assuming
        the user already voted if write is unavailable */}
        {/* TODO: Make it obvious that the user already voted. Right now the button is just disabled
        Haven't done-so yet because the text "Already Voted" makes the button look ugly*/}
        <VoteButton onClick={write}>Vote</VoteButton>
      </HStack>
    </VStack>
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

function NounsDisplay({
  nouns,
  totalNouns,
}: {
  totalNouns: number;
  nouns: NounGridFragment$data["nounsRepresented"];
}) {
  return (
    <HStack alignItems="center">
      {/* TODO: These don't overlap like in the design */}
      <NounGridChildren
        totalNouns={totalNouns}
        count={4}
        nouns={nouns}
        imageSize="8"
        overflowFontSize="xs"
      />
    </HStack>
  );
}

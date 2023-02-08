import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { UserIcon } from "@heroicons/react/20/solid";
import { css } from "@emotion/css";
import { motion } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { ReactNode } from "react";
import {
  colorForSupportType,
  SupportTextProps,
} from "../DelegatePage/VoteDetailsContainer";
import { CastVoteDialogQuery } from "./__generated__/CastVoteDialogQuery.graphql";
import { TokenAmountDisplay } from "../../components/TokenAmountDisplay";
import { OptimismGovernorV1 } from "../../contracts/generated";
import { governorTokenContract } from "../../contracts/contracts";
import { useContractWrite } from "../../hooks/useContractWrite";
import { useAccount } from "wagmi";
import { Link } from "../../components/HammockRouter/Link";

type Props = {
  proposalId: string;
  reason: string;
  supportType: SupportTextProps["supportType"];
  closeDialog: () => void;
};

// TODO: Better rendering for users with no voting power
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
  reason,
  supportType,
  closeDialog,
}: Props) {
  // Ideal flow (not implemented yet):
  // 1. Check that user doesn't have a delegate
  // 2. Check that user has >0 Nouns
  // 3. Check that user has not already voted
  // Notes:
  // If user has no nouns, fields are null

  const { address: accountAddress } = useAccount();

  const { delegate } = useLazyLoadQuery<CastVoteDialogQuery>(
    graphql`
      query CastVoteDialogQuery($accountAddress: String!, $skip: Boolean!) {
        delegate(addressOrEnsName: $accountAddress) @skip(if: $skip) {
          statement {
            __typename
          }

          address {
            resolvedName {
              ...NounResolvedLinkFragment
            }
          }

          tokensRepresented {
            amount {
              ...TokenAmountDisplayFragment
            }
          }
        }
      }
    `,
    {
      accountAddress: accountAddress ?? "",
      skip: !accountAddress,
    }
  );

  const write = useContractWrite<OptimismGovernorV1, "castVoteWithReason">(
    governorTokenContract,
    "castVoteWithReason",
    [proposalId, ["AGAINST", "FOR", "ABSTAIN"].indexOf(supportType), reason],
    () => closeDialog()
  );

  if (!delegate) {
    // todo: log
    return null;
  }

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
            {delegate.address?.resolvedName ? (
              <NounResolvedLink resolvedName={delegate.address?.resolvedName} />
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
            className={css`
              color: #66676b;
            `}
          >
            <div>
              <TokenAmountDisplay
                fragment={delegate.tokensRepresented.amount}
              />
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
        <VStack>
          <div
            className={css`
              font-weight: ${theme.fontWeight.semibold};
            `}
          >
            Using{" "}
            <TokenAmountDisplay fragment={delegate.tokensRepresented.amount} />
          </div>
          <div
            className={css`
              font-weight: ${theme.fontWeight.medium};
              color: ${theme.colors.gray[700]};
            `}
          >
            Delegated to you
          </div>
        </VStack>
        {/* TODO: There are a lot of reasons why write is unavailable. We've captured
        most of them by disable the vote buttons in the VotesCastPanel, so we're assuming
        the user already voted if write is unavailable */}
        {/* TODO: Make it obvious that the user already voted. Right now the button is just disabled
        Haven't done-so yet because the text "Already Voted" makes the button look ugly*/}
        {delegate.statement ? (
          <VoteButton onClick={write}>Vote</VoteButton>
        ) : (
          <div>
            You do not have a delegate statement.{" "}
            <Link
              to="/create"
              className={css`
                text-decoration: underline;
              `}
            >
              Please set one up in order to vote.
            </Link>
          </div>
        )}
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

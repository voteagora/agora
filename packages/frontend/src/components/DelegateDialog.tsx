import * as Sentry from "@sentry/react";
import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";
import { inset0 } from "../theme";
import * as theme from "../theme";
import { HStack, VStack } from "./VStack";
import { shadow } from "../pages/DelegatePage/VoterPanel";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";
import { ArrowDownIcon } from "@heroicons/react/20/solid";
import { css } from "@emotion/css";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { DelegateDialogQuery } from "./__generated__/DelegateDialogQuery.graphql";
import { DelegateDialogFragment$key } from "./__generated__/DelegateDialogFragment.graphql";
import { NounResolvedLink } from "./NounResolvedLink";
import { ReactNode } from "react";
import { TokenAmountDisplay } from "./TokenAmountDisplay";
import ensIcon from "../icons/ens.png";
import { TokenAmountDisplayFragment$key } from "./__generated__/TokenAmountDisplayFragment.graphql";

export function DelegateDialog({
  fragment,
  isOpen,
  closeDialog,
  completeDelegation,
}: {
  fragment: DelegateDialogFragment$key;
  isOpen: boolean;
  closeDialog: () => void;
  completeDelegation: () => void;
}) {
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
            overflow-y: scroll;
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
              max-width: ${theme.maxWidth.md};
              background: ${theme.colors.white};
              border-radius: ${theme.spacing["3"]};
              padding: ${theme.spacing["6"]};
            `}
          >
            <DelegateDialogContents
              fragment={fragment}
              completeDelegation={completeDelegation}
            />
          </Dialog.Panel>
        </VStack>
      </Dialog>
    </>
  );
}

function ENSAmountDisplay({
  fragment,
}: {
  fragment: TokenAmountDisplayFragment$key | null | undefined;
}) {
  if (!fragment) {
    return null;
  }

  return (
    <HStack
      gap="2"
      className={css`
        color: ${theme.colors.black};
        font-size: ${theme.fontSize["4xl"]};
      `}
      alignItems="center"
    >
      <img
        className={css`
          width: ${theme.spacing["8"]};
          height: ${theme.spacing["8"]};
        `}
        src={ensIcon}
        alt="ens-token"
      />

      <TokenAmountDisplay fragment={fragment} />
    </HStack>
  );
}

function DelegateDialogContents({
  fragment,
  completeDelegation,
}: {
  fragment: DelegateDialogFragment$key;
  completeDelegation: () => void;
}) {
  const { address: accountAddress } = useAccount();
  const { address } = useLazyLoadQuery<DelegateDialogQuery>(
    graphql`
      query DelegateDialogQuery($address: String!, $skip: Boolean!) {
        address(addressOrEnsName: $address) @skip(if: $skip) {
          resolvedName {
            address
          }

          account {
            amountOwned {
              amount {
                ...TokenAmountDisplayFragment
              }
            }
          }
        }
      }
    `,
    {
      address: accountAddress ?? "",
      skip: !accountAddress,
    }
  );

  const wrappedDelegate = useFragment(
    graphql`
      fragment DelegateDialogFragment on WrappedDelegate {
        address {
          resolvedName {
            address
            ...NounResolvedLinkFragment
          }
        }

        delegate {
          tokensRepresented {
            amount {
              ...TokenAmountDisplayFragment
            }
          }
        }
      }
    `,
    fragment
  );

  // todo: share contract address configuration
  const { config } = usePrepareContractWrite({
    address: "0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03",
    abi: [
      {
        inputs: [
          {
            internalType: "address",
            name: "delegatee",
            type: "address",
          },
        ],
        name: "delegate",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    functionName: "delegate",
    args: [wrappedDelegate.address.resolvedName.address as any],
    onError(e) {
      Sentry.captureException(e);
    },
  });

  const { write } = useContractWrite(config as any);

  return (
    <VStack gap="8" alignItems="stretch">
      <VStack
        gap="3"
        alignItems="center"
        className={css`
          padding-top: ${theme.spacing["3"]};
          padding-bottom: ${theme.spacing["3"]};
          border-radius: ${theme.spacing["2"]};
          background: rgba(250, 250, 250, 0.95);
          border: 1px solid ${theme.colors.gray.eb};

          color: #66676b;
          font-size: ${theme.fontSize.xs};
        `}
      >
        {(() => {
          if (!address) {
            return (
              <VStack gap="3" alignItems="center">
                <div>Delegating your tokens</div>
              </VStack>
            );
          }

          if (!address?.account?.amountOwned) {
            return (
              <div
                className={css`
                  padding: ${theme.spacing["12"]};
                  padding-bottom: ${theme.spacing["4"]};
                `}
              >
                You don't have any tokens to delegate
              </div>
            );
          } else {
            return (
              <VStack gap="3" alignItems="center">
                <div>Delegating your</div>

                <ENSAmountDisplay
                  fragment={address.account.amountOwned.amount}
                />
              </VStack>
            );
          }
        })()}

        <VStack
          className={css`
            width: 100%;
            z-index: 1;
            position: relative;
          `}
          alignItems="center"
        >
          <VStack
            justifyContent="center"
            className={css`
              position: absolute;
              ${inset0};
              z-index: -1;
            `}
          >
            <div
              className={css`
                height: 1px;
                background: ${theme.colors.gray.eb};
              `}
            />
          </VStack>

          <VStack
            className={css`
              width: ${theme.spacing["10"]};
              height: ${theme.spacing["10"]};
              background: ${theme.colors.white};
              border: 1px solid ${theme.colors.gray.eb};
              border-radius: ${theme.borderRadius.full};
              padding: ${theme.spacing["2"]};
              box-shadow: ${shadow};
            `}
          >
            <ArrowDownIcon
              className={css`
                color: black;
              `}
            />
          </VStack>
        </VStack>

        <VStack>
          <div
            className={css`
              text-align: center;
            `}
          >
            To{" "}
            <NounResolvedLink
              resolvedName={wrappedDelegate.address.resolvedName}
            />{" "}
            who represents
          </div>
          <ENSAmountDisplay
            fragment={wrappedDelegate?.delegate?.tokensRepresented?.amount}
          />
        </VStack>
      </VStack>

      {(() => {
        if (!address) {
          return <DelegateButton>Connect Wallet</DelegateButton>;
        }

        if (!address?.account?.amountOwned) {
          return null;
        }

        return (
          <DelegateButton onClick={() => write?.()}>Delegate</DelegateButton>
        );
      })()}
    </VStack>
  );
}

type DelegateButtonProps = {
  onClick?: () => void;
  children: ReactNode;
};

const DelegateButton = ({ children, onClick }: DelegateButtonProps) => {
  return (
    <div
      onClick={onClick}
      className={css`
        text-align: center;
        border-radius: ${theme.spacing["2"]};
        border: 1px solid ${theme.colors.gray.eb};
        font-weight: ${theme.fontWeight.semibold};
        padding: ${theme.spacing["4"]} 0;
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

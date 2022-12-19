import * as Sentry from "@sentry/react";
import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { useMutation } from "@tanstack/react-query";
import { inset0, shadow } from "../theme";
import * as theme from "../theme";
import { HStack, VStack } from "./VStack";
import {
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
  useProvider,
  useSigner,
} from "wagmi";
import { ArrowDownIcon } from "@heroicons/react/20/solid";
import { css } from "@emotion/css";
import { motion } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { DelegateDialogQuery } from "./__generated__/DelegateDialogQuery.graphql";
import { NounResolvedLink } from "./NounResolvedLink";
import { ReactNode } from "react";
import { TokenAmountDisplay } from "./TokenAmountDisplay";
import ensIcon from "../icons/ens.png";
import { TokenAmountDisplayFragment$key } from "./__generated__/TokenAmountDisplayFragment.graphql";
import { delegateUsingRelay } from "./ensDelegateRelay";

export function DelegateDialog({
  target,
  completeDelegation,
}: {
  target: string;
  completeDelegation: () => void;
}) {
  return (
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
          targetAccountAddress={target}
          completeDelegation={completeDelegation}
        />
      </Dialog.Panel>
    </VStack>
  );
}

function OPAmountDisplay({
  fragment,
}: {
  fragment: TokenAmountDisplayFragment$key;
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
  targetAccountAddress,
  completeDelegation,
}: {
  targetAccountAddress: string;
  completeDelegation: () => void;
}) {
  const { address: accountAddress } = useAccount();
  const { currentAccount, delegate } = useLazyLoadQuery<DelegateDialogQuery>(
    graphql`
      query DelegateDialogQuery(
        $targetAccountAddress: String!
        $currentAccountAddress: String!
        $skipCurrentAccount: Boolean!
      ) {
        delegate(addressOrEnsName: $targetAccountAddress) {
          address {
            resolvedName {
              address
              ...NounResolvedLinkFragment
            }
          }

          tokensRepresented {
            amount {
              ...TokenAmountDisplayFragment
            }
          }
        }

        currentAccount: delegate(addressOrEnsName: $currentAccountAddress)
          @skip(if: $skipCurrentAccount) {
          amountOwned {
            amount {
              ...TokenAmountDisplayFragment
            }
          }
        }
      }
    `,
    {
      targetAccountAddress,
      currentAccountAddress: accountAddress ?? "",
      skipCurrentAccount: !accountAddress,
    }
  );

  // todo: share contract address configuration
  const { config } = usePrepareContractWrite({
    address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
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
    args: [delegate?.address?.resolvedName?.address as any],
    onError(e) {
      Sentry.captureException(e);
    },
  });

  const { writeAsync: delegateUsingTransaction } = useContractWrite(
    config as any
  );
  const provider = useProvider();
  const signer = useSigner();

  const { mutate: delegateVotes, isLoading } = useMutation({
    async mutationFn(delegate: string) {
      if (!signer.data) {
        return;
      }

      const result = await delegateUsingRelay(provider, signer.data, delegate);
      if (!result) {
        await delegateUsingTransaction?.();
      }

      completeDelegation();
    },
  });

  if (!delegate) {
    return null;
  }

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
        <VStack
          className={css`
            padding: ${theme.spacing["4"]} ${theme.spacing["12"]};
          `}
          alignItems="center"
          gap="3"
        >
          {(() => {
            if (!currentAccount?.amountOwned?.amount) {
              return <div>You don't have any tokens to delegate</div>;
            } else {
              return (
                <>
                  <div>Delegating your</div>

                  <OPAmountDisplay
                    fragment={currentAccount.amountOwned.amount}
                  />
                </>
              );
            }
          })()}
        </VStack>

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

        <VStack
          className={css`
            padding: ${theme.spacing["4"]} ${theme.spacing["12"]};
          `}
        >
          <div
            className={css`
              text-align: center;
            `}
          >
            To <NounResolvedLink resolvedName={delegate.address.resolvedName} />{" "}
            who represents
          </div>

          <OPAmountDisplay fragment={delegate.tokensRepresented.amount} />
        </VStack>
      </VStack>

      {(() => {
        if (!currentAccount) {
          return (
            <DelegateButton disabled={isLoading}>Connect Wallet</DelegateButton>
          );
        }

        return (
          <DelegateButton
            disabled={isLoading}
            onClick={() => delegateVotes(delegate.address.resolvedName.address)}
          >
            Delegate
          </DelegateButton>
        );
      })()}
    </VStack>
  );
}

type DelegateButtonProps = {
  onClick?: () => void;
  disabled: boolean;
  children: ReactNode;
};

const DelegateButton = ({
  children,
  disabled,
  onClick,
}: DelegateButtonProps) => {
  const effectiveOnClick = !disabled ? onClick : undefined;
  return (
    <div
      onClick={effectiveOnClick}
      className={css`
        text-align: center;
        border-radius: ${theme.spacing["2"]};
        border: 1px solid ${theme.colors.gray.eb};
        font-weight: ${theme.fontWeight.semibold};
        padding: ${theme.spacing["4"]} 0;
        cursor: pointer;

        ${!effectiveOnClick &&
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

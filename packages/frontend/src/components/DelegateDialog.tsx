import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { inset0 } from "../theme";
import * as theme from "../theme";
import { HStack, VStack } from "./VStack";
import { NounGridChildren } from "./NounGrid";
import { shadow } from "../pages/DelegatePage/VoterPanel";
import { useAccount } from "wagmi";
import { ArrowDownIcon } from "@heroicons/react/20/solid";
import { css } from "@emotion/css";
import { motion } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { DelegateDialogQuery } from "./__generated__/DelegateDialogQuery.graphql";
import { NounGridFragment$data } from "./__generated__/NounGridFragment.graphql";
import { icons } from "../icons/icons";
import { NounResolvedLink } from "./NounResolvedLink";
import { NounsToken } from "../contracts/generated";
import { ReactNode } from "react";
import { nounsToken } from "../contracts/contracts";
import { useContractWrite } from "../hooks/useContractWrite";

export function DelegateDialog({
  targetAccountAddress,
  completeDelegation,
}: {
  targetAccountAddress: string;
  completeDelegation: () => void;
}) {
  return (
    <>
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
            targetAccountAddress={targetAccountAddress}
            completeDelegation={completeDelegation}
          />
        </Dialog.Panel>
      </VStack>
    </>
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
  const { wrappedDelegate, address } = useLazyLoadQuery<DelegateDialogQuery>(
    graphql`
      query DelegateDialogQuery(
        $currentAccountAddress: String!
        $targetAccountAddress: String!
        $skip: Boolean!
      ) {
        wrappedDelegate: address(addressOrEnsName: $targetAccountAddress) {
          wrappedDelegate {
            address {
              resolvedName {
                address
                ...NounResolvedLinkFragment
              }
            }

            delegate {
              delegatedVotesRaw
              nounsRepresented {
                id
                ...NounImageFragment
              }

              tokenHoldersRepresented {
                address {
                  resolvedName {
                    address
                  }
                }
              }
            }
          }
        }

        address(addressOrEnsName: $currentAccountAddress) @skip(if: $skip) {
          resolvedName {
            address
          }

          account {
            tokenBalance
            nouns {
              id
              ...NounImageFragment
            }
          }
        }
      }
    `,
    {
      targetAccountAddress,
      currentAccountAddress: accountAddress ?? "",
      skip: !accountAddress,
    }
  );

  const write = useContractWrite<NounsToken, "delegate">(
    nounsToken,
    "delegate",
    [targetAccountAddress],
    () => completeDelegation()
  );

  if (!wrappedDelegate) {
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
        {(() => {
          if (!address) {
            return (
              <VStack gap="3" alignItems="center">
                <div>Delegating your nouns</div>

                <HStack>
                  <img
                    alt="anon noun"
                    className={css`
                      width: ${theme.spacing["8"]};
                      height: ${theme.spacing["8"]};
                    `}
                    src={icons.anonNoun}
                  />
                </HStack>
              </VStack>
            );
          }

          if (!address?.account?.nouns.length) {
            return (
              <div
                className={css`
                  padding: ${theme.spacing["12"]};
                  padding-bottom: ${theme.spacing["4"]};
                `}
              >
                You don't have any nouns to delegate
              </div>
            );
          } else {
            return (
              <VStack gap="3" alignItems="center">
                <div>Delegating your nouns</div>

                <NounsDisplay
                  nouns={address.account.nouns}
                  totalNouns={Number(address.account.tokenBalance)}
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

        <NounsDisplay
          totalNouns={Number(
            wrappedDelegate.wrappedDelegate.delegate?.delegatedVotesRaw ?? "0"
          )}
          nouns={
            wrappedDelegate.wrappedDelegate.delegate?.nounsRepresented ?? []
          }
        />

        <NounResolvedLink
          resolvedName={wrappedDelegate.wrappedDelegate.address.resolvedName}
        />
      </VStack>

      {(() => {
        if (!address) {
          return <DelegateButton>Connect Wallet</DelegateButton>;
        }

        if (!address?.account?.nouns.length) {
          return null;
        }

        const addressesRepresented =
          wrappedDelegate?.wrappedDelegate?.delegate?.tokenHoldersRepresented.map(
            (holder) => holder.address.resolvedName.address
          ) ?? [];
        const alreadyDelegated = addressesRepresented.includes(
          address.resolvedName.address
        );

        if (alreadyDelegated) {
          return <DelegateButton>You're already delegated!</DelegateButton>;
        }

        return (
          <DelegateButton onClick={write}>
            {address ? (
              <>Delegate {address?.account?.nouns?.length} votes</>
            ) : (
              <>Delegate your nouns</>
            )}
          </DelegateButton>
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

type NounsDisplayProps = {
  totalNouns: number;
  nouns: NounGridFragment$data["nounsRepresented"];
};

function NounsDisplay({ nouns, totalNouns }: NounsDisplayProps) {
  const columns = 6;
  const imageSize = "8";
  const gapSize = "2";

  return (
    <HStack
      justifyContent="center"
      gap={gapSize}
      className={css`
        max-width: calc(
          ${theme.spacing[imageSize]} * ${columns} + ${theme.spacing[gapSize]} *
            ${columns - 1}
        );
        flex-wrap: wrap;
      `}
    >
      <NounGridChildren
        totalNouns={totalNouns}
        count={6 * 8 + 1}
        nouns={nouns}
        imageSize={imageSize}
        overflowFontSize="xs"
      />
    </HStack>
  );
}

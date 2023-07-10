import { css } from "@emotion/css";
import * as theme from "../theme";
import { inset0 } from "../theme";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { ProfileDropDownButtonFragment$key } from "./__generated__/ProfileDropDownButtonFragment.graphql";
import { HStack, VStack } from "./VStack";
import React, { ReactNode } from "react";
import { Link } from "./HammockRouter/Link";
import { TokenAmountDisplay } from "./TokenAmountDisplay";
import { icons } from "../icons/icons";
import { shortAddress } from "../utils/address";
import { Popover, Transition } from "@headlessui/react";
import { ENSAvatar } from "./ENSAvatar";
import { PanelRow } from "./VoterPanel/Rows/PanelRow";
import { pluralizeAddresses } from "../words";
import { useDisconnect } from "wagmi";
import { NounResolvedName } from "./NounResolvedName";
import { AnimatePresence, motion } from "framer-motion";
import { ethers } from "ethers";

type Props = {
  isConnected: boolean;
  isConnecting: boolean;
  show?: () => void;
  hide?: () => void;
  address: `0x${string}` | undefined;
  ensName: string | undefined;
  fragment: ProfileDropDownButtonFragment$key;
  hasStatement?: boolean;
};

// Add your variants
const variants = {
  hidden: { y: "100%" },
  show: { y: "0%" },
  exit: { y: "100%" },
};

const MobileValueWrapper = ({ children }: { children: ReactNode }) => (
  <div className={css(`font-size: ${theme.fontSize.base}`)}>{children}</div>
);

export const MobileProfileDropDownButton = ({
  fragment,
  hasStatement,
}: Props) => {
  const { disconnect } = useDisconnect();

  const delegate = useFragment(
    graphql`
      fragment MobileProfileDropDownButtonFragment on Delegate {
        address {
          resolvedName {
            address
            name

            ...NounResolvedNameFragment
            ...ENSAvatarFragment
          }
        }

        delegatingTo {
          address {
            resolvedName {
              address
              name

              ...NounResolvedNameFragment
              ...ENSAvatarFragment
            }
          }
        }

        amountOwned {
          amount {
            ...TokenAmountDisplayFragment
          }
        }

        tokensRepresented {
          amount {
            ...TokenAmountDisplayFragment
          }
        }

        delegateMetrics {
          tokenHoldersRepresentedCount
        }
      }
    `,
    fragment
  );

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            className={css`
              padding: ${theme.spacing[2]} ${theme.spacing[5]};
              outline: none;
            `}
          >
            <HStack alignItems="center" gap="1">
              <img
                src={icons.walletConnected}
                alt="connect wallet button"
                className={css`
                  opacity: 1;
                `}
              />
            </HStack>
          </Popover.Button>

          {open && (
            <AnimatePresence>
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
            </AnimatePresence>
          )}

          <Transition className="absolute z-10">
            <Popover.Panel>
              {({ close }) => (
                <motion.div
                  className={css`
                    background-color: ${theme.colors.white};
                    padding: ${theme.spacing[7]} ${theme.spacing[6]};
                    border-top-left-radius: ${theme.spacing[4]};
                    border-top-right-radius: ${theme.spacing[4]};
                    width: 100vw;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                  `}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  variants={variants}
                  transition={{ duration: 0.2 }}
                >
                  <VStack
                    className={css`
                      gap: ${theme.spacing[3]};
                    `}
                  >
                    <HStack
                      className={css`
                        align-items: center;
                        gap: ${theme.spacing[2]};
                        margin-bottom: ${theme.spacing[1]};
                      `}
                    >
                      <ENSAvatar
                        fragment={delegate.address.resolvedName}
                        className={css`
                          width: 51px;
                          height: 51px;
                          border-radius: 100%;
                        `}
                      />
                      <VStack
                        className={css`
                          flex: 1;
                        `}
                      >
                        {delegate.address.resolvedName.name ? (
                          <>
                            <span
                              className={css`
                                font-size: ${theme.fontSize.base};
                              `}
                            >
                              {delegate.address.resolvedName.name}
                            </span>
                            <span
                              className={css`
                                font-size: ${theme.fontSize.xs};
                                color: #4f4f4f;
                              `}
                            >
                              {shortAddress(
                                delegate.address.resolvedName.address
                              )}
                            </span>
                          </>
                        ) : (
                          <>
                            <span
                              className={css`
                                font-size: ${theme.fontSize.base};
                              `}
                            >
                              {shortAddress(
                                delegate.address.resolvedName.address
                              )}
                            </span>
                          </>
                        )}
                      </VStack>
                      <img
                        src={icons.power}
                        onClick={() => disconnect()}
                        alt="Disconnect Wallet"
                        className={css`
                          width: 32px;
                          height: 32px;
                          margin-right: 5px;
                        `}
                      />
                    </HStack>

                    <PanelRow
                      title="My token balance"
                      detail={
                        <MobileValueWrapper>
                          <TokenAmountDisplay
                            fragment={delegate.amountOwned.amount}
                          />
                        </MobileValueWrapper>
                      }
                    />

                    <PanelRow
                      title="Delegated to"
                      detail={
                        <MobileValueWrapper>
                          {delegate.delegatingTo.address.resolvedName
                            .address === ethers.constants.AddressZero ? (
                            "N/A"
                          ) : (
                            <NounResolvedName
                              resolvedName={
                                delegate.delegatingTo.address.resolvedName
                              }
                            />
                          )}
                        </MobileValueWrapper>
                      }
                    />

                    <PanelRow
                      title="My voting power"
                      detail={
                        <MobileValueWrapper>
                          <TokenAmountDisplay
                            fragment={delegate.tokensRepresented.amount}
                          />
                        </MobileValueWrapper>
                      }
                    />

                    <PanelRow
                      title="Delegated from"
                      detail={
                        <MobileValueWrapper>
                          {pluralizeAddresses(
                            delegate.delegateMetrics
                              .tokenHoldersRepresentedCount ?? 0
                          )}
                        </MobileValueWrapper>
                      }
                    />

                    <Link
                      to="/create"
                      className={css`
                        border-radius: ${theme.borderRadius.lg};
                        border-width: ${theme.spacing.px};
                        padding: ${theme.spacing["3"]} ${theme.spacing["2"]};
                        color: ${theme.colors.gray["200"]};
                        background: ${theme.colors.black};
                        display: flex;
                        justify-content: center;
                        margin-top: ${theme.spacing[1]};
                        :hover {
                          background: ${theme.colors.gray["800"]};
                        }
                      `}
                      afterUpdate={close}
                    >
                      <div>
                        {hasStatement
                          ? "Edit delegate statement"
                          : "Create delegate statement"}
                      </div>
                    </Link>

                    {hasStatement && (
                      <Link
                        to={`/delegate/${
                          delegate.address.resolvedName.name ??
                          delegate.address.resolvedName.address
                        }`}
                        className={css`
                          border-radius: ${theme.borderRadius.lg};
                          border-width: ${theme.spacing.px};
                          padding: ${theme.spacing["3"]} ${theme.spacing["2"]};
                          color: ${theme.colors.black};
                          background: ${theme.colors.white};
                          margin-top: ${theme.spacing[1]};
                          display: flex;
                          justify-content: center;
                          :hover {
                            background: ${theme.colors.gray["800"]};
                            color: ${theme.colors.white};
                          }
                        `}
                        afterUpdate={close}
                      >
                        <div>View my profile</div>
                      </Link>
                    )}
                  </VStack>
                </motion.div>
              )}
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

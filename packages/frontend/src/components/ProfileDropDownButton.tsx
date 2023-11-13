import { css } from "@emotion/css";
import * as theme from "../theme";
import { inset0 } from "../theme";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { ProfileDropDownButtonFragment$key } from "./__generated__/ProfileDropDownButtonFragment.graphql";
import { HStack, VStack } from "./VStack";
import { ReactNode, useEffect, useState } from "react";
import { Link } from "./HammockRouter/Link";
import { TokenAmountDisplay } from "./TokenAmountDisplay";
import { icons } from "../icons/icons";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { shortAddress } from "../utils/address";
import { Popover, Transition } from "@headlessui/react";
import { ENSAvatar } from "./ENSAvatar";
import { PanelRow } from "./VoterPanel/Rows/PanelRow";
import { pluralizeAddresses } from "../words";
import { useDisconnect } from "wagmi";
import { NounResolvedName } from "./NounResolvedName";
import { AnimatePresence, motion } from "framer-motion";
import { ethers } from "ethers";
import { useSIWE } from "connectkit";

type Props = {
  address: `0x${string}` | undefined;
  ensName: string | undefined;
  fragment: ProfileDropDownButtonFragment$key;
  hasStatment?: boolean;
  handleSignOut?: () => void;
};

const ValueWrapper = ({ children }: { children: ReactNode }) => (
  <div className={css(`font-size: ${theme.fontSize.base}`)}>{children}</div>
);

export const ProfileDropDownButton = ({
  address,
  ensName,
  fragment,
  hasStatment,
  handleSignOut,
}: Props) => {
  const { disconnect } = useDisconnect();

  const delegate = useFragment(
    graphql`
      fragment ProfileDropDownButtonFragment on Delegate {
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

  const { isSignedIn, signIn } = useSIWE();

  const [canSignin, setCanSignin] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      fetch(`${process.env.PUBLIC_URL}/api/auth/can-signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      }).then(async (res) => {
        const result = await res.json();
        setCanSignin(result.canSignin ?? false);
      });
    }
  });

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
              {isSignedIn ? (
                <img
                  className={css`
                    width: ${theme.spacing[6]};
                    height: ${theme.spacing[6]};
                    margin-left: -${theme.spacing[2]};
                  `}
                  src={icons.badge}
                  alt="badge symbol"
                />
              ) : (
                <div
                  className={css`
                    width: ${theme.spacing[1]};
                    height: ${theme.spacing[1]};
                    border-radius: ${theme.borderRadius.full};
                    background-color: #23b100;
                  `}
                />
              )}
              <div>{ensName ? ensName : shortAddress(address ?? "")}</div>

              <ChevronDownIcon
                aria-hidden="true"
                className={css`
                  opacity: 30%;
                  width: ${theme.spacing["4"]};
                  height: ${theme.spacing["4"]};
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

          <Transition
            className="absolute z-10 right-0"
            enter="transition duration-00 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Popover.Panel>
              {({ close }) => (
                <div
                  className={css`
                    background-color: ${theme.colors.white};
                    padding: ${theme.spacing[7]} ${theme.spacing[6]};
                    margin-top: ${theme.spacing[2]};
                    border-radius: ${theme.spacing[4]};
                    width: 350px;
                  `}
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
                      <div
                        className={css`
                          position: relative;
                          aspect-ratio: 1/1;
                        `}
                      >
                        {isSignedIn && (
                          <img
                            className={css`
                              position: absolute;
                              bottom: -5px;
                              right: -7px;
                              z-index: 1;
                            `}
                            src={icons.badge}
                            alt="badge symbol"
                          />
                        )}
                        <ENSAvatar
                          className={css`
                            width: 44px;
                            height: 44px;
                            border-radius: 100%;
                          `}
                          fragment={delegate.address.resolvedName}
                        />
                      </div>
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
                        onClick={(e) => {
                          if (handleSignOut) handleSignOut();
                          disconnect();
                        }}
                        alt="Disconnect Wallet"
                        className={css`
                          width: 32px;
                          height: 32px;
                        `}
                      />
                    </HStack>

                    <PanelRow
                      title="My token balance"
                      detail={
                        <ValueWrapper>
                          <TokenAmountDisplay
                            fragment={delegate.amountOwned.amount}
                          />
                        </ValueWrapper>
                      }
                    />

                    <PanelRow
                      title="Delegated to"
                      detail={
                        <ValueWrapper>
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
                        </ValueWrapper>
                      }
                    />

                    <PanelRow
                      title="My voting power"
                      detail={
                        <ValueWrapper>
                          <TokenAmountDisplay
                            fragment={delegate.tokensRepresented.amount}
                          />
                        </ValueWrapper>
                      }
                    />

                    <PanelRow
                      title="Delegated from"
                      detail={
                        <ValueWrapper>
                          {pluralizeAddresses(
                            delegate.delegateMetrics
                              .tokenHoldersRepresentedCount ?? 0
                          )}
                        </ValueWrapper>
                      }
                    />

                    {!isSignedIn && canSignin && (
                      <div>
                        <button
                          className={css`
                            width: 100%;
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
                          onClick={() => signIn()}
                        >
                          <div>Sign in as badgeholder</div>
                        </button>
                      </div>
                    )}

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
                        {hasStatment
                          ? "Edit delegate statement"
                          : "Create delegate statement"}
                      </div>
                    </Link>

                    {isSignedIn && (
                      <Link
                        to={`/retroPGF/3/ballot`}
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
                        <div>View my ballot</div>
                      </Link>
                    )}

                    {hasStatment && (
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
                </div>
              )}
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

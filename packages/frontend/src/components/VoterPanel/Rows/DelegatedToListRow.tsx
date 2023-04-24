import { graphql, useFragment } from "react-relay";
import React, { useState } from "react";
import { css } from "@emotion/css";
import { BigNumber } from "ethers";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useAccount } from "wagmi";
import { nounsAlligator, nounsToken } from "@agora/common";
import { Address } from "@wagmi/core";

import { useContractWriteFn } from "../../../hooks/useContractWrite";
import * as theme from "../../../theme";
import { LiquidDelegationRules } from "../LiquidDelegationRules";
import { NounGridChildren } from "../../NounGrid";
import { NounResolvedLink } from "../../NounResolvedLink";
import { pluralizeDelegations } from "../../../words";
import { HStack, VStack } from "../../VStack";
import { restrictiveRules } from "../../DelegateDialog/delegateRules";

import { DelegatedToListRowFragment$key } from "./__generated__/DelegatedToListRowFragment.graphql";
import { ExpandItemsArrow } from "./DelegateFromListRow";
import { PanelRow } from "./PanelRow";

export function DelegatedToListRow({
  fragmentRef,
}: {
  fragmentRef: DelegatedToListRowFragment$key;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const delegate = useFragment(
    graphql`
      fragment DelegatedToListRowFragment on Delegate {
        address {
          resolvedName {
            address
          }
        }

        tokensOwned {
          amount {
            amount
          }
        }

        nounsOwned {
          # eslint-disable-next-line relay/unused-fields
          id
          # eslint-disable-next-line relay/must-colocate-fragment-spreads
          ...NounImageFragment
        }

        delegatingTo {
          address {
            resolvedName {
              address
              ...NounResolvedLinkFragment
            }
          }
        }

        liquidDelegationProxyAddress {
          address
        }

        liquidDelegations {
          to {
            resolvedName {
              address
              ...NounResolvedLinkFragment
            }
          }

          rules {
            ...LiquidDelegationRulesFragment
          }
        }
      }
    `,
    fragmentRef
  );

  const { address } = useAccount();

  const isTokenDelegatingToLiquidDelegationProxy =
    delegate.delegatingTo.address.resolvedName.address ===
    delegate.liquidDelegationProxyAddress.address;

  const delegations = [
    ...(() => {
      if (!delegate.delegatingTo) {
        return [];
      }

      if (
        delegate.liquidDelegationProxyAddress.address ===
        delegate.delegatingTo.address.resolvedName.address
      ) {
        return [];
      }

      return [
        {
          type: "TOKEN_DELEGATION" as const,
          delegate: delegate.delegatingTo,
        },
      ];
    })(),
    ...(() => {
      if (!isTokenDelegatingToLiquidDelegationProxy) {
        return [];
      }

      return delegate.liquidDelegations.map((liquidDelegation) => ({
        type: "LIQUID_DELEGATION" as const,
        liquidDelegation,
      }));
    })(),
  ];

  const writeLiquidDelegate = useContractWriteFn(nounsAlligator, "subDelegate");

  const writeTokenDelegation = useContractWriteFn(nounsToken, "delegate");
  return (
    <VStack gap="1">
      <PanelRow
        title="Delegating to"
        detail={
          <div onClick={() => setIsExpanded((lastValue) => !lastValue)}>
            <HStack
              alignItems="center"
              gap="1"
              className={css`
                cursor: pointer;
                user-select: none;
              `}
            >
              {delegate.nounsOwned.length ? (
                <HStack gap="1" alignItems="center">
                  <div>{pluralizeDelegations(delegations.length)}</div>{" "}
                  <ExpandItemsArrow isExpanded={isExpanded} />
                </HStack>
              ) : (
                <div>{pluralizeDelegations(0)}</div>
              )}
            </HStack>
          </div>
        }
      />

      {isExpanded && (
        <VStack gap="2">
          {delegations.map((delegation, idx) => (
            <VStack key={idx}>
              <HStack justifyContent="space-between">
                <div
                  className={css`
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    overflow: hidden;
                  `}
                >
                  {(() => {
                    switch (delegation.type) {
                      case "LIQUID_DELEGATION": {
                        return (
                          <NounResolvedLink
                            resolvedName={
                              delegation.liquidDelegation.to.resolvedName
                            }
                          />
                        );
                      }

                      case "TOKEN_DELEGATION": {
                        return (
                          delegate.nounsOwned.length > 0 && (
                            <NounResolvedLink
                              resolvedName={
                                delegation.delegate.address.resolvedName
                              }
                            />
                          )
                        );
                      }
                    }
                  })()}
                </div>

                <HStack alignItems="center" gap="1">
                  {(() => {
                    if (delegation.type !== "TOKEN_DELEGATION") {
                      return null;
                    }

                    return (
                      <HStack
                        gap="1"
                        className={css`
                          flex-shrink: 0;
                        `}
                      >
                        <NounGridChildren
                          liquidRepresentation={[]}
                          totalNouns={BigNumber.from(
                            delegate.tokensOwned.amount.amount
                          ).toNumber()}
                          count={5}
                          nouns={delegate.nounsOwned}
                          overflowFontSize="xs"
                          imageSize="6"
                        />
                      </HStack>
                    );
                  })()}

                  {(() => {
                    if (address !== delegate.address.resolvedName.address) {
                      return null;
                    }

                    if (
                      delegate.address.resolvedName.address ===
                      delegate.delegatingTo.address.resolvedName.address
                    ) {
                      return null;
                    }

                    return (
                      <div
                        onClick={async () => {
                          switch (delegation.type) {
                            case "TOKEN_DELEGATION": {
                              await writeTokenDelegation([
                                delegate.address.resolvedName
                                  .address as Address,
                              ]);
                              break;
                            }

                            case "LIQUID_DELEGATION": {
                              await writeLiquidDelegate([
                                delegation.liquidDelegation.to.resolvedName
                                  .address as Address,
                                restrictiveRules(),
                                false,
                              ]);
                              break;
                            }
                          }
                        }}
                        className={css`
                          cursor: pointer;
                          display: flex;
                          flex-direction: column;
                          padding: ${theme.spacing["1"]};
                          border-radius: ${theme.borderRadius.md};
                          transition: 0.3s background;

                          :hover {
                            background: ${theme.colors.gray.eb};
                          }
                        `}
                      >
                        <XMarkIcon
                          aria-hidden="true"
                          className={css`
                            color: ${theme.colors.gray.af};
                            width: ${theme.spacing["4"]};
                            height: ${theme.spacing["4"]};
                          `}
                        />
                      </div>
                    );
                  })()}
                </HStack>
              </HStack>

              {(() => {
                if (delegation.type === "TOKEN_DELEGATION") {
                  return null;
                }

                const rules = delegation.liquidDelegation.rules;

                return <LiquidDelegationRules fragmentRef={rules} />;
              })()}
            </VStack>
          ))}
        </VStack>
      )}
    </VStack>
  );
}

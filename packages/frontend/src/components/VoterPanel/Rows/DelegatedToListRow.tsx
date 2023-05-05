import { graphql, useFragment } from "react-relay";
import React, { useState } from "react";
import { css } from "@emotion/css";
import { BigNumber } from "ethers";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useAccount } from "wagmi";
import { nounsAlligator, nounsToken } from "@agora/common";
import { Address } from "@wagmi/core";

import {
  handlingError,
  useContractWriteFn,
} from "../../../hooks/useContractWrite";
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

      if (!delegate.nounsOwned.length) {
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
          delegations.length ? (
            <div onClick={() => setIsExpanded((lastValue) => !lastValue)}>
              <HStack
                alignItems="center"
                gap="1"
                className={css`
                  cursor: pointer;
                  user-select: none;
                `}
              >
                <HStack gap="1" alignItems="center">
                  {pluralizeDelegations(delegations.length)}{" "}
                  <ExpandItemsArrow isExpanded={isExpanded} />
                </HStack>
              </HStack>
            </div>
          ) : (
            <>None</>
          )
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
                          <NounResolvedLink
                            resolvedName={
                              delegation.delegate.address.resolvedName
                            }
                          />
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

                    switch (delegation.type) {
                      case "TOKEN_DELEGATION": {
                        if (
                          delegate.address.resolvedName.address ===
                          delegate.delegatingTo.address.resolvedName.address
                        ) {
                          return null;
                        }

                        return (
                          <RemoveDelegationButton
                            onClick={() =>
                              handlingError(
                                writeTokenDelegation([
                                  delegate.address.resolvedName
                                    .address as Address,
                                ])
                              )
                            }
                          />
                        );
                      }

                      case "LIQUID_DELEGATION": {
                        return (
                          <RemoveDelegationButton
                            onClick={() =>
                              handlingError(
                                writeLiquidDelegate([
                                  delegation.liquidDelegation.to.resolvedName
                                    .address as Address,
                                  restrictiveRules(),
                                  false,
                                ])
                              )
                            }
                          />
                        );
                      }
                    }
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

function RemoveDelegationButton({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
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
}

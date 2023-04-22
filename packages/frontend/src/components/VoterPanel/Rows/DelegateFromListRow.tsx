import { css } from "@emotion/css";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import graphql from "babel-plugin-relay/macro";
import { BigNumber } from "ethers";
import React, { useMemo, useState } from "react";
import { useFragment } from "react-relay";

import * as theme from "../../../theme";
import { descendingValueComparator } from "../../../utils/sorting";
import { pluralizeAddresses } from "../../../words";
import { NounGridChildren } from "../../NounGrid";
import { NounResolvedLink } from "../../NounResolvedLink";
import { HStack, VStack } from "../../VStack";
import { LiquidDelegationRules } from "../LiquidDelegationRules";

import { PanelRow } from "./PanelRow";
import { DelegateFromListRowFragment$key } from "./__generated__/DelegateFromListRowFragment.graphql";

export function DelegateFromList({
  fragment,
}: {
  fragment: DelegateFromListRowFragment$key;
}) {
  const { tokenHoldersRepresented, completeLiquidRepresentation } = useFragment(
    graphql`
      fragment DelegateFromListRowFragment on Delegate {
        completeLiquidRepresentation: liquidRepresentation(filter: {}) {
          owner {
            address {
              resolvedName {
                ...NounResolvedLinkFragment
              }
            }
          }

          # eslint-disable-next-line relay/unused-fields
          proxy {
            nounsRepresented {
              id
              # eslint-disable-next-line relay/must-colocate-fragment-spreads
              ...NounImageFragment
            }
          }

          lots {
            rules {
              ...LiquidDelegationRulesFragment
            }
          }
        }

        tokenHoldersRepresented {
          tokensOwned {
            amount {
              amount
            }
          }

          address {
            resolvedName {
              ...NounResolvedLinkFragment
            }
          }

          nounsOwned {
            # eslint-disable-next-line relay/unused-fields
            id
            # eslint-disable-next-line relay/must-colocate-fragment-spreads
            ...NounImageFragment
          }
        }
      }
    `,
    fragment
  );

  const tokenHolders = useMemo(() => {
    return tokenHoldersRepresented
      .filter((holder) => !!holder.nounsOwned.length)
      .slice()
      .sort(descendingValueComparator((item) => item.nounsOwned.length));
  }, [tokenHoldersRepresented]);

  const [isExpanded, setIsExpanded] = useState(false);

  const representations = [
    ...tokenHolders.map((tokenHolder) => ({
      type: "TOKEN_REPRESENTATION" as const,
      tokenHolder,
    })),
    ...completeLiquidRepresentation.flatMap((liquidRepresentation) => {
      if (!liquidRepresentation.proxy.nounsRepresented.length) {
        return [];
      }

      return [
        {
          type: "LIQUID_REPRESENTATION" as const,
          liquidRepresentation,
        },
      ];
    }),
  ];

  return (
    <VStack gap="1">
      <PanelRow
        title="Delegated from"
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
              {representations.length ? (
                <HStack gap="1" alignItems="center">
                  <div>{pluralizeAddresses(representations.length)}</div>{" "}
                  <ExpandItemsArrow isExpanded={isExpanded} />
                </HStack>
              ) : (
                <div>{pluralizeAddresses(representations.length)}</div>
              )}
            </HStack>
          </div>
        }
      />

      {isExpanded && (
        <VStack gap="1">
          {representations.map((representation, idx) => {
            return (
              <VStack>
                <HStack key={idx} justifyContent="space-between">
                  <div
                    className={css`
                      text-overflow: ellipsis;
                      white-space: nowrap;
                      overflow: hidden;
                    `}
                  >
                    <NounResolvedLink
                      resolvedName={(() => {
                        switch (representation.type) {
                          case "TOKEN_REPRESENTATION": {
                            return representation.tokenHolder.address
                              .resolvedName;
                          }

                          case "LIQUID_REPRESENTATION": {
                            return representation.liquidRepresentation.owner
                              .address.resolvedName;
                          }
                        }
                      })()}
                    />
                  </div>

                  <HStack
                    gap="1"
                    className={css`
                      flex-shrink: 0;
                    `}
                  >
                    <NounGridChildren
                      {...(() => {
                        switch (representation.type) {
                          case "TOKEN_REPRESENTATION": {
                            return {
                              liquidRepresentation: [],
                              totalNouns: BigNumber.from(
                                representation.tokenHolder.tokensOwned.amount
                                  .amount
                              ).toNumber(),
                              nouns: representation.tokenHolder.nounsOwned,
                            };
                          }

                          case "LIQUID_REPRESENTATION": {
                            return {
                              liquidRepresentation: [
                                representation.liquidRepresentation,
                              ],
                              totalNouns: 0,
                              nouns: [],
                            };
                          }
                        }
                      })()}
                      count={5}
                      overflowFontSize="xs"
                      imageSize="6"
                    />
                  </HStack>
                </HStack>

                {(() => {
                  if (representation.type !== "LIQUID_REPRESENTATION") {
                    return null;
                  }

                  return (
                    <VStack gap="1">
                      {representation.liquidRepresentation.lots.map((lot) => (
                        <LiquidDelegationRules fragmentRef={lot.rules} />
                      ))}
                    </VStack>
                  );
                })()}
              </VStack>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
}

export function ExpandItemsArrow({ isExpanded }: { isExpanded: boolean }) {
  return (
    <ChevronDownIcon
      aria-hidden="true"
      className={css`
        margin-bottom: -0.125rem;
        transition: transform 0.3s;
        width: ${theme.spacing["4"]};
        height: ${theme.spacing["4"]};
        ${isExpanded &&
        css`
          transform: rotateZ(180deg);
        `}
      `}
    />
  );
}

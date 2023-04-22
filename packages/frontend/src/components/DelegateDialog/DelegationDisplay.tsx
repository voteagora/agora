import { css } from "@emotion/css";
import { ArrowDownIcon } from "@heroicons/react/20/solid";
import graphql from "babel-plugin-relay/macro";
import { BigNumber } from "ethers";
import { useFragment } from "react-relay";

import { icons } from "../../icons/icons";
import * as theme from "../../theme";
import { inset0, shadow } from "../../theme";
import { NounGridChildren } from "../NounGrid";
import { NounResolvedLink } from "../NounResolvedLink";
import { HStack, VStack } from "../VStack";
import { NounGridFragment$data } from "../__generated__/NounGridFragment.graphql";

import { DelegationDisplayFragment$key } from "./__generated__/DelegationDisplayFragment.graphql";

export function DelegationDisplay({
  fragmentRef,
}: {
  fragmentRef: DelegationDisplayFragment$key;
}) {
  const { currentDelegate, targetDelegate } = useFragment(
    graphql`
      fragment DelegationDisplayFragment on Query
      @argumentDefinitions(
        currentAccountAddress: { type: "String!" }
        targetAccountAddress: { type: "String!" }
        skip: { type: "Boolean!" }
      ) {
        targetDelegate: delegate(addressOrEnsName: $targetAccountAddress) {
          address {
            resolvedName {
              address
              ...NounResolvedLinkFragment
            }
          }

          tokensRepresented {
            amount {
              amount
            }
          }

          liquidRepresentation(filter: { currentlyActive: true }) {
            # eslint-disable-next-line relay/unused-fields
            proxy {
              nounsRepresented {
                id
                # eslint-disable-next-line relay/must-colocate-fragment-spreads
                ...NounImageFragment
              }
            }
          }

          nounsRepresented {
            # eslint-disable-next-line relay/unused-fields
            id
            # eslint-disable-next-line relay/must-colocate-fragment-spreads
            ...NounImageFragment
          }
        }

        currentDelegate: delegate(addressOrEnsName: $currentAccountAddress)
          @skip(if: $skip) {
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

          liquidRepresentation(filter: { currentlyActive: true }) {
            owner {
              address {
                address
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
    fragmentRef
  );

  return (
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
        if (!currentDelegate) {
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

        const liquidRepresentation =
          currentDelegate.liquidRepresentation.filter(
            (it) =>
              it.owner.address.address !==
              currentDelegate?.address.resolvedName.address
          );

        const nouns = currentDelegate.nounsOwned;

        if (!(liquidRepresentation.length + nouns.length)) {
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
                liquidRepresentation={liquidRepresentation}
                nouns={nouns}
                totalNouns={BigNumber.from(
                  currentDelegate.tokensOwned.amount.amount
                ).toNumber()}
              />
            </VStack>
          );
        }
      })()}

      <DividerWithArrow />

      <NounsDisplay
        liquidRepresentation={targetDelegate.liquidRepresentation}
        totalNouns={Number(
          BigNumber.from(targetDelegate.tokensRepresented.amount.amount)
        )}
        nouns={targetDelegate.nounsRepresented}
      />

      <NounResolvedLink resolvedName={targetDelegate.address.resolvedName} />
    </VStack>
  );
}

type NounsDisplayProps = {
  totalNouns: number;
  nouns: NounGridFragment$data["nounsRepresented"];
  liquidRepresentation: NounGridFragment$data["liquidRepresentation"];
};

function NounsDisplay({
  nouns,
  totalNouns,
  liquidRepresentation,
}: NounsDisplayProps) {
  const columns = 8;
  const maxRows = 2;
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
        liquidRepresentation={liquidRepresentation}
        count={columns * maxRows}
        nouns={nouns}
        imageSize={imageSize}
        overflowFontSize="xs"
      />
    </HStack>
  );
}

function DividerWithArrow() {
  return (
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
  );
}

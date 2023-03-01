import { useFragment } from "react-relay";
import * as theme from "../../../theme";
import graphql from "babel-plugin-relay/macro";
import { PanelRow } from "./PanelRow";
import { DelegateFromListRowFragment$key } from "./__generated__/DelegateFromListRowFragment.graphql";
import { pluralizeAddresses } from "../../../words";
import React, { useMemo, useState } from "react";
import { HStack, VStack } from "../../VStack";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { css } from "@emotion/css";
import { NounResolvedLink } from "../../NounResolvedLink";
import { NounGridChildren } from "../../NounGrid";
import { descendingValueComparator } from "../../../utils/sorting";
import { BigNumber } from "ethers";

export function DelegateFromList({
  fragment,
}: {
  fragment: DelegateFromListRowFragment$key;
}) {
  const { tokenHoldersRepresented } = useFragment(
    graphql`
      fragment DelegateFromListRowFragment on Delegate {
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
              <div>{pluralizeAddresses(tokenHolders.length)}</div>
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
            </HStack>
          </div>
        }
      />

      {isExpanded &&
        tokenHolders.map((holder, idx) => (
          <HStack key={idx} justifyContent="space-between">
            <div
              className={css`
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
              `}
            >
              <NounResolvedLink resolvedName={holder.address.resolvedName} />
            </div>

            <HStack
              gap="1"
              className={css`
                flex-shrink: 0;
              `}
            >
              <NounGridChildren
                totalNouns={BigNumber.from(
                  holder.tokensOwned.amount.amount
                ).toNumber()}
                count={5}
                nouns={holder.nounsOwned}
                overflowFontSize="xs"
                imageSize="6"
              />
            </HStack>
          </HStack>
        ))}
    </VStack>
  );
}

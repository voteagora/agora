import { useFragment, graphql } from "react-relay";
import { css } from "@emotion/css";
import { BigNumber } from "ethers";

import * as theme from "../theme";

import { DelegateProfileImageFragment$key } from "./__generated__/DelegateProfileImageFragment.graphql";
import { NounsRepresentedGrid } from "./NounGrid";
import { HStack } from "./VStack";

type Props = {
  fragment: DelegateProfileImageFragment$key;
  dense?: boolean;
};

export function DelegateProfileImage({ fragment, dense }: Props) {
  const delegate = useFragment(
    graphql`
      fragment DelegateProfileImageFragment on Delegate {
        tokensRepresented {
          amount {
            amount
          }
        }
        liquidRepresentation(filter: { currentlyActive: true }) {
          proxy {
            nounsRepresented {
              __typename
            }
          }
        }

        ...NounGridFragment
      }
    `,
    fragment
  );

  const liquidRepresentedNouns = delegate.liquidRepresentation.flatMap(
    (liquidRepresentation) => liquidRepresentation.proxy.nounsRepresented
  );

  const totalNounsRepresented = BigNumber.from(
    delegate.tokensRepresented.amount.amount
  ).add(liquidRepresentedNouns.length);

  return totalNounsRepresented.isZero() ? (
    <HStack
      alignItems="center"
      className={css`
        border-radius: ${theme.borderRadius.full};
        border: 1px solid ${theme.colors.gray.eb};
        box-shadow: ${theme.boxShadow.newDefault};
        margin: ${theme.spacing["4"]} 0;
      `}
    >
      <div
        className={css`
          font-size: ${theme.fontSize.xs};
          font-weight: ${theme.fontWeight.semibold};
          color: ${theme.colors.gray["700"]};
          padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
        `}
      >
        No delegation currently
      </div>
    </HStack>
  ) : (
    <NounsRepresentedGrid
      rows={3}
      columns={dense ? 6 : 5}
      gap={dense ? "2" : "4"}
      imageSize={dense ? "10" : "12"}
      overflowFontSize="base"
      fragmentKey={delegate}
    />
  );
}

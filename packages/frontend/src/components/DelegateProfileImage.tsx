import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import { DelegateProfileImageFragment$key } from "./__generated__/DelegateProfileImageFragment.graphql";
import { NounsRepresentedGrid } from "./NounGrid";
import * as theme from "../theme";
import { HStack } from "./VStack";
import { useEnsAvatar } from "wagmi";
import { icons } from "../icons/icons";
import { BigNumber } from "ethers";

type Props = {
  fragment: DelegateProfileImageFragment$key;
  dense?: boolean;
};

export function DelegateProfileImage({ fragment, dense }: Props) {
  const delegate = useFragment(
    graphql`
      fragment DelegateProfileImageFragment on Delegate {
        address {
          resolvedName {
            address
          }
        }
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

  const avatar = useEnsAvatar({
    address: delegate.address.resolvedName.address as any,
  });

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
      <img
        className={css`
          width: 44px;
          height: 44px;
          border-radius: 100%;
        `}
        src={avatar.data || icons.anonNoun}
        alt={"anon noun"}
      />
      <div
        className={css`
          font-size: ${theme.fontSize.sm};
          font-weight: ${theme.fontWeight.semibold};
          padding: 0 ${theme.spacing["4"]};
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
